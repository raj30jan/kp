import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MembershipPlan } from './entities/membership-plan.entity'
import { MembershipSubscription } from './entities/membership-subscription.entity'
import { User } from '../users/entities/user.entity'
import { SubscribeDto } from './dto/subscribe.dto'

const FREE_LIMIT = 5

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(MembershipPlan) private readonly planRepo: Repository<MembershipPlan>,
    @InjectRepository(MembershipSubscription) private readonly subRepo: Repository<MembershipSubscription>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

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
        'p.name AS planName', 'u.displayName AS userName', 'u.mobile AS userMobile', 'u.email AS userEmail',
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
  }) {
    const plan = await this.findPlan(dto.planId)
    const sub = this.subRepo.create({
      userId: dto.userId,
      planId: dto.planId,
      status: dto.status || 'active',
      startDate: dto.startDate || new Date(),
      endDate: dto.endDate ?? null,
      amount: String(dto.amount ?? plan.price),
      paymentReference: dto.paymentReference || null,
    })
    return this.subRepo.save(sub)
  }

  /** [Admin UI] Cancel a single subscription. */
  async cancelSubscription(id: string) {
    const sub = await this.subRepo.findOne({ where: { id } })
    if (!sub) throw new NotFoundException('Subscription not found')
    sub.status = 'cancelled'
    return this.subRepo.save(sub)
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

    return {
      isPaid,
      subscription: activeSub || null,
      freeListingsUsed: user.freeListingsUsed,
      freeListingsRemaining: isPaid ? null : Math.max(FREE_LIMIT - user.freeListingsUsed, 0),
      freeContactsUsed: user.freeContactsUsed,
      freeContactsRemaining: isPaid ? null : Math.max(FREE_LIMIT - user.freeContactsUsed, 0),
      freeLimit: FREE_LIMIT,
    }
  }

  /**
   * Creates/activates a subscription for the user. Since no payment gateway
   * is wired yet, this activates immediately on call — TODO: replace with a
   * real Razorpay/Stripe flow that only calls this after payment success,
   * passing the real paymentReference.
   */
  async subscribe(userId: string, dto: SubscribeDto) {
    const plan = await this.planRepo.findOne({ where: { code: dto.planCode, isActive: 1 } })
    if (!plan) throw new BadRequestException('Unknown or inactive plan')
    if (plan.code === 'free') throw new BadRequestException('Free plan does not require subscribing')

    const now = new Date()
    const endDate = plan.durationDays ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000) : null

    const sub = this.subRepo.create({
      userId,
      planId: plan.id,
      status: 'active',
      startDate: now,
      endDate,
      amount: plan.price,
      paymentReference: dto.paymentReference || null,
    })
    return this.subRepo.save(sub)
  }

  /** Throws if a free-tier user has hit the lifetime listing cap; else increments the counter. */
  async consumeFreeListing(userId: string): Promise<void> {
    if (await this.hasActiveSubscription(userId)) return
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')
    if (user.freeListingsUsed >= FREE_LIMIT) {
      throw new ForbiddenException(
        `Free plan allows only ${FREE_LIMIT} product listings in your lifetime. Please subscribe to the Quarterly Membership (₹100) to post more.`,
      )
    }
    user.freeListingsUsed += 1
    await this.userRepo.save(user)
  }

  /** Throws if a free-tier user has hit the lifetime contact-reveal cap; else increments the counter. */
  async consumeFreeContact(userId: string): Promise<void> {
    if (await this.hasActiveSubscription(userId)) return
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')
    if (user.freeContactsUsed >= FREE_LIMIT) {
      throw new ForbiddenException(
        `Free plan allows only ${FREE_LIMIT} seller-contact reveals in your lifetime. Please subscribe to the Quarterly Membership (₹100) to contact more sellers.`,
      )
    }
    user.freeContactsUsed += 1
    await this.userRepo.save(user)
  }
}
