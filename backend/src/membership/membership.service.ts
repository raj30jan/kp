import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { MembershipPlan } from './entities/membership-plan.entity'
import { MembershipSubscription } from './entities/membership-subscription.entity'
import { MembershipPayment } from './entities/membership-payment.entity'
import { User } from '../users/entities/user.entity'
import { SubscribeDto } from './dto/subscribe.dto'

const FREE_LIMIT = 5
/** Roles that bypass the free-tier caps without a paid subscription. */
const PAYWALL_EXEMPT_ROLES = ['agent', 'admin', 'super_admin']

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name)

  constructor(
    @InjectRepository(MembershipPlan) private readonly planRepo: Repository<MembershipPlan>,
    @InjectRepository(MembershipSubscription) private readonly subRepo: Repository<MembershipSubscription>,
    @InjectRepository(MembershipPayment) private readonly paymentRepo: Repository<MembershipPayment>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Hourly: flip `active` subscriptions whose end_date has passed to
   * `expired`, so the admin ledger and the member's status page reflect
   * reality without waiting for the next access check.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireOverdueSubscriptions() {
    const result = await this.subRepo
      .createQueryBuilder()
      .update(MembershipSubscription)
      .set({ status: 'expired' })
      .where('status = :status AND end_date IS NOT NULL AND end_date < :now', { status: 'active', now: new Date() })
      .execute()
    if (result.affected) this.logger.log(`Expired ${result.affected} overdue membership subscription(s)`)
    return result.affected ?? 0
  }

  async getPlans() {
    return this.planRepo.find({ where: { isActive: 1 }, order: { price: 'ASC' } })
  }

  /** [Admin UI] All plans, including inactive ones. */
  async adminListPlans() {
    return this.planRepo.find({ order: { price: 'ASC' } })
  }

  /** [Admin UI] Create a new membership plan. */
  async createPlan(dto: {
    code: string; name: string; price: number; billingCycle: string
    durationDays?: number; freeListingLimit?: number; isActive?: number
  }) {
    const existing = await this.planRepo.findOne({ where: { code: dto.code } })
    if (existing) throw new BadRequestException('A plan with this code already exists')
    const plan = this.planRepo.create({
      ...dto,
      price: String(dto.price),
      isActive: dto.isActive ?? 1,
    } as any)
    return this.planRepo.save(plan)
  }

  async findPlan(id: number) {
    const plan = await this.planRepo.findOne({ where: { id } })
    if (!plan) throw new NotFoundException('Plan not found')
    return plan
  }

  /** [Admin UI] Edit a plan's fields. */
  async updatePlan(id: number, dto: Partial<{
    name: string; price: number; billingCycle: string
    durationDays: number | null; freeListingLimit: number | null; isActive: number
  }>) {
    const plan = await this.findPlan(id)
    Object.assign(plan, { ...dto, price: dto.price !== undefined ? String(dto.price) : plan.price })
    return this.planRepo.save(plan)
  }

  /** [Admin UI] Delete a plan — blocked if subscriptions still reference it (FK safety). */
  async deletePlan(id: number) {
    const inUse = await this.subRepo.count({ where: { planId: id } })
    if (inUse > 0) {
      throw new BadRequestException(`Cannot delete: ${inUse} subscription(s) reference this plan`)
    }
    await this.planRepo.delete(id)
    return { success: true }
  }

  /** [Admin UI] Paginated, searchable, sortable subscriptions with plan name + subscriber joined in. */
  async adminListSubscriptions(
    page = 1,
    limit = 20,
    q?: string,
    sort: string = 'createdAt',
    dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const qb = this.subRepo
      .createQueryBuilder('s')
      .leftJoin(MembershipPlan, 'p', 'p.id = s.planId')
      .leftJoin(User, 'u', 'u.id = s.userId')
      .select([
        's.id AS id', 's.status AS status', 's.startDate AS startDate', 's.endDate AS endDate',
        's.amount AS amount', 's.paymentReference AS paymentReference', 's.createdAt AS createdAt',
        'p.name AS planName', 'p.durationDays AS planDurationDays',
        'u.id AS userId', 'u.displayName AS userName', 'u.mobile AS userMobile', 'u.email AS userEmail', 'u.role AS userRole',
      ])

    if (q) {
      qb.andWhere('(u.displayName LIKE :q OR u.mobile LIKE :q OR u.email LIKE :q OR p.name LIKE :q)', { q: `%${q}%` })
    }

    const sortable: Record<string, string> = {
      createdAt: 's.createdAt', amount: 's.amount', status: 's.status', endDate: 's.endDate',
    }
    qb.orderBy(sortable[sort] || 's.createdAt', dir === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const total = await qb.getCount()
    const items = await qb.getRawMany()
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1, sort, dir }
  }

  /** [Admin UI] Look up a user by mobile or email (for the "grant subscription" form). */
  async findUserByMobileOrEmail(identifier: string) {
    const user = await this.userRepo.findOne({ where: [{ mobile: identifier }, { email: identifier }] })
    if (!user) throw new NotFoundException(`No user found with mobile/email "${identifier}"`)
    return user
  }

  /** [Admin UI] Manually grant a subscription to a user (e.g. goodwill/complementary access). */
  async adminCreateSubscription(dto: {
    userId: string; planId: number; status?: string
    startDate?: Date; endDate?: Date | null; amount?: number; paymentReference?: string
    grantedBy?: string; remarks?: string
  }) {
    const plan = await this.findPlan(dto.planId)
    const status = dto.status || 'active'
    const startDate = dto.startDate || new Date()
    const sub = await this.subRepo.save(
      this.subRepo.create({
        userId: dto.userId,
        planId: dto.planId,
        status,
        startDate,
        endDate: dto.endDate ?? (plan.durationDays ? new Date(startDate.getTime() + plan.durationDays * 86_400_000) : null),
        amount: String(dto.amount ?? plan.price),
        paymentReference: dto.paymentReference || null,
      }),
    )
    // Ledger entry so manual grants are auditable alongside UPI payments.
    await this.paymentRepo.save(
      this.paymentRepo.create({
        subscriptionId: sub.id,
        userId: dto.userId,
        planId: dto.planId,
        amount: sub.amount,
        method: dto.paymentReference ? 'upi' : 'manual',
        paymentReference: dto.paymentReference || null,
        status: status === 'pending' ? 'pending' : 'verified',
        verifiedBy: dto.grantedBy || null,
        verifiedAt: status === 'pending' ? null : new Date(),
        remarks: dto.remarks || (dto.paymentReference ? null : 'Granted manually by admin'),
      }),
    )
    return sub
  }

  /**
   * [Admin UI] Cancel a single subscription. A `pending` one is a payment
   * that could not be verified → marked `rejected` (and the ledger row too);
   * anything else is an entitlement being revoked → `cancelled`.
   */
  async cancelSubscription(id: string, adminId?: string, remarks?: string) {
    const sub = await this.subRepo.findOne({ where: { id } })
    if (!sub) throw new NotFoundException('Subscription not found')
    if (sub.status === 'pending') return this.rejectSubscription(id, adminId, remarks)
    sub.status = 'cancelled'
    return this.subRepo.save(sub)
  }

  /** [Admin UI] Payment could not be verified — reject the pending subscription and its ledger row. */
  async rejectSubscription(id: string, adminId?: string, remarks?: string) {
    const sub = await this.subRepo.findOne({ where: { id } })
    if (!sub) throw new NotFoundException('Subscription not found')
    if (sub.status !== 'pending') throw new BadRequestException('Only pending subscriptions can be rejected')
    sub.status = 'rejected'
    await this.subRepo.save(sub)
    await this.paymentRepo.update(
      { subscriptionId: id, status: 'pending' },
      { status: 'rejected', verifiedBy: adminId || null, verifiedAt: new Date(), remarks: remarks || 'Payment could not be verified' },
    )
    return sub
  }

  /** [Admin UI] Bulk-cancel selected subscriptions. */
  async bulkCancelSubscriptions(ids: string[]) {
    if (!ids.length) return { affected: 0 }
    const result = await this.subRepo
      .createQueryBuilder()
      .update(MembershipSubscription)
      .set({ status: 'cancelled' })
      .where('id IN (:...ids)', { ids })
      .execute()
    return { affected: result.affected ?? 0 }
  }

  /** [Admin UI] Count of currently-active subscriptions, for dashboard KPIs. */
  async countActiveSubscriptions() {
    return this.subRepo.count({ where: { status: 'active' } })
  }

  /** True if the user has a currently-active (non-expired) paid subscription. */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const sub = await this.subRepo.findOne({
      where: { userId, status: 'active' },
      order: { createdAt: 'DESC' },
    })
    if (!sub) return false
    if (sub.endDate && new Date(sub.endDate) < new Date()) return false
    return true
  }

  async getMyStatus(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')

    const activeSub = await this.subRepo.findOne({
      where: { userId, status: 'active' },
      order: { createdAt: 'DESC' },
    })
    const isPaid = !!activeSub && (!activeSub.endDate || new Date(activeSub.endDate) >= new Date())

    const pendingSubRow = isPaid
      ? null
      : await this.subRepo.findOne({ where: { userId, status: 'pending' }, order: { createdAt: 'DESC' } })
    const planIds = [activeSub?.planId, pendingSubRow?.planId].filter((v): v is number => v != null)
    const plans = planIds.length ? await this.planRepo.find({ where: { id: In(planIds) } }) : []
    const planOf = (id?: number | null) => plans.find((p) => Number(p.id) === Number(id))
    const activePlan = planOf(activeSub?.planId)
    const pendingPlan = planOf(pendingSubRow?.planId)

    return {
      isPaid,
      subscription: activeSub
        ? { ...activeSub, planName: activePlan?.name, planCode: activePlan?.code, durationDays: activePlan?.durationDays ?? null }
        : null,
      pendingSubscription: pendingSubRow
        ? { ...pendingSubRow, planName: pendingPlan?.name, planCode: pendingPlan?.code }
        : null,
      payments: await this.myPayments(userId),
      freeListingsUsed: user.freeListingsUsed,
      freeListingsRemaining: isPaid ? null : Math.max(FREE_LIMIT - user.freeListingsUsed, 0),
      freeContactsUsed: user.freeContactsUsed,
      freeContactsRemaining: isPaid ? null : Math.max(FREE_LIMIT - user.freeContactsUsed, 0),
      freeLimit: FREE_LIMIT,
    }
  }

  /**
   * QR / UPI payment flow: the member scans the super-admin uploaded QR,
   * pays the plan amount and submits the UPI transaction reference here.
   * The subscription is created as `pending` and only becomes `active`
   * when an admin verifies the payment (`approveSubscription`). Dates are
   * set at approval time so the member gets the full duration.
   */
  async subscribe(userId: string, dto: SubscribeDto) {
    const plan = await this.planRepo.findOne({ where: { code: dto.planCode, isActive: 1 } })
    if (!plan) throw new BadRequestException('Unknown or inactive plan')
    if (plan.code === 'free') throw new BadRequestException('Free plan does not require subscribing')
    if (!dto.paymentReference || dto.paymentReference.trim().length < 6) {
      throw new BadRequestException('Please enter the UPI transaction reference / UTR number from your payment app')
    }
    if (await this.hasActiveSubscription(userId)) {
      throw new BadRequestException('You already have an active membership')
    }
    const pending = await this.subRepo.findOne({ where: { userId, status: 'pending' } })
    if (pending) {
      throw new BadRequestException('Your previous payment is still awaiting verification. Our team will activate it shortly.')
    }
    const reference = dto.paymentReference.trim()
    // The same UTR can only ever pay for one membership.
    const reused = await this.paymentRepo.findOne({ where: { paymentReference: reference, status: In(['pending', 'verified']) } })
    if (reused) {
      throw new BadRequestException('This UPI transaction reference has already been submitted. Please check the UTR in your payment app.')
    }

    const sub = await this.subRepo.save(
      this.subRepo.create({
        userId,
        planId: plan.id,
        status: 'pending',
        startDate: null,
        endDate: null,
        amount: plan.price,
        paymentReference: reference,
      }),
    )
    await this.paymentRepo.save(
      this.paymentRepo.create({
        subscriptionId: sub.id,
        userId,
        planId: plan.id,
        amount: plan.price,
        method: 'upi',
        paymentReference: reference,
        status: 'pending',
      }),
    )
    return sub
  }

  /**
   * [Admin UI] Admin verified the UPI payment — activate the pending
   * subscription. Start = the moment of verification; end = start +
   * plan.durationDays (exact timestamp, so a 90-day plan approved at 14:05
   * expires 90 days later at 14:05). The ledger row records who verified.
   */
  async approveSubscription(id: string, adminId?: string) {
    const sub = await this.subRepo.findOne({ where: { id } })
    if (!sub) throw new NotFoundException('Subscription not found')
    if (sub.status !== 'pending') throw new BadRequestException('Only pending subscriptions can be approved')
    const plan = await this.planRepo.findOne({ where: { id: sub.planId } })
    const now = new Date()
    sub.status = 'active'
    sub.startDate = now
    sub.endDate = plan?.durationDays ? new Date(now.getTime() + plan.durationDays * 86_400_000) : null
    await this.subRepo.save(sub)
    await this.paymentRepo.update(
      { subscriptionId: id, status: 'pending' },
      { status: 'verified', verifiedBy: adminId || null, verifiedAt: now },
    )
    return sub
  }

  /** [Admin UI] Payment ledger with subscriber profile + verifier, filterable by status, searchable. */
  async adminListPayments(page = 1, limit = 20, status?: string, q?: string) {
    const qb = this.paymentRepo
      .createQueryBuilder('pay')
      .leftJoin(MembershipPlan, 'p', 'p.id = pay.planId')
      .leftJoin(User, 'u', 'u.id = pay.userId')
      .leftJoin(User, 'v', 'v.id = pay.verifiedBy')
      .leftJoin(MembershipSubscription, 's', 's.id = pay.subscriptionId')
      .select([
        'pay.id AS id', 'pay.amount AS amount', 'pay.method AS method', 'pay.paymentReference AS paymentReference',
        'pay.status AS status', 'pay.verifiedAt AS verifiedAt', 'pay.remarks AS remarks', 'pay.createdAt AS createdAt',
        'pay.subscriptionId AS subscriptionId',
        'p.name AS planName', 'p.durationDays AS planDurationDays',
        'u.id AS userId', 'u.displayName AS userName', 'u.mobile AS userMobile', 'u.email AS userEmail', 'u.role AS userRole',
        'u.createdAt AS userSince',
        'v.displayName AS verifierName', 'v.email AS verifierEmail',
        's.status AS subscriptionStatus', 's.startDate AS startDate', 's.endDate AS endDate',
      ])
    if (status) qb.andWhere('pay.status = :status', { status })
    if (q) {
      qb.andWhere('(u.displayName LIKE :q OR u.mobile LIKE :q OR u.email LIKE :q OR pay.paymentReference LIKE :q OR p.name LIKE :q)', { q: `%${q}%` })
    }
    qb.orderBy('pay.createdAt', 'DESC').skip((page - 1) * limit).take(limit)
    const total = await qb.getCount()
    const items = await qb.getRawMany()
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 }
  }

  /** [Admin UI] Ledger totals for the KPI strip. */
  async paymentTotals() {
    const rows = await this.paymentRepo
      .createQueryBuilder('pay')
      .select('pay.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(pay.amount), 0)', 'amount')
      .groupBy('pay.status')
      .getRawMany()
    const out: Record<string, { count: number; amount: number }> = { pending: { count: 0, amount: 0 }, verified: { count: 0, amount: 0 }, rejected: { count: 0, amount: 0 } }
    for (const r of rows) out[r.status] = { count: Number(r.count), amount: Number(r.amount) }
    return out
  }

  /** Member's own payment history (newest first) for the /membership page. */
  async myPayments(userId: string, limit = 10) {
    return this.paymentRepo
      .createQueryBuilder('pay')
      .leftJoin(MembershipPlan, 'p', 'p.id = pay.planId')
      .leftJoin(MembershipSubscription, 's', 's.id = pay.subscriptionId')
      .select([
        'pay.id AS id', 'pay.amount AS amount', 'pay.method AS method', 'pay.paymentReference AS paymentReference',
        'pay.status AS status', 'pay.verifiedAt AS verifiedAt', 'pay.remarks AS remarks', 'pay.createdAt AS createdAt',
        'p.name AS planName', 'p.code AS planCode', 's.startDate AS startDate', 's.endDate AS endDate', 's.status AS subscriptionStatus',
      ])
      .where('pay.userId = :userId', { userId })
      .orderBy('pay.createdAt', 'DESC')
      .take(limit)
      .getRawMany()
  }

  /** Count of subscriptions awaiting payment verification (admin dashboard badge). */
  async countPendingSubscriptions() {
    return this.subRepo.count({ where: { status: 'pending' } })
  }

  /**
   * Throws if a free-tier user has hit the lifetime listing cap; else
   * increments the counter. Agents (field partners who list on behalf of
   * farmers) and staff roles are exempt from the free cap.
   */
  async consumeFreeListing(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')
    if (await this.hasPaidAccess(user)) return
    if (user.freeListingsUsed >= FREE_LIMIT) {
      throw new ForbiddenException(
        `Free plan allows only ${FREE_LIMIT} product listings in your lifetime. Please subscribe to the Quarterly Membership (₹100) to post more.`,
      )
    }
    user.freeListingsUsed += 1
    await this.userRepo.save(user)
  }

  /**
   * True when the user may bypass the free-tier paywall: an active paid
   * subscription, or a privileged role (agents list on behalf of farmers;
   * staff need unrestricted access). Single source of truth for both the
   * listing cap and the seller-contact gate.
   */
  async hasPaidAccess(userOrId: User | string): Promise<boolean> {
    const user = typeof userOrId === 'string' ? await this.userRepo.findOne({ where: { id: userOrId } }) : userOrId
    if (!user) return false
    if (PAYWALL_EXEMPT_ROLES.includes(user.role)) return true
    return this.hasActiveSubscription(user.id)
  }

  /** Throws if a free-tier user has hit the lifetime contact-reveal cap; else increments the counter. */
  async consumeFreeContact(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')
    if (await this.hasPaidAccess(user)) return
    if (user.freeContactsUsed >= FREE_LIMIT) {
      throw new ForbiddenException(
        `Free plan allows only ${FREE_LIMIT} seller-contact reveals in your lifetime. Please subscribe to the Quarterly Membership (₹100) to contact more sellers.`,
      )
    }
    user.freeContactsUsed += 1
    await this.userRepo.save(user)
  }
}
