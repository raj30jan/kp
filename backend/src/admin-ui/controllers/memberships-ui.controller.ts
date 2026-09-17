import { Body, Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { MembershipService } from '../../membership/membership.service'
import { AdminErrorFilter } from '../admin-error.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { baseViewModel, parseIds, setFlash } from '../admin-ui.util'

@Controller('admin/memberships')
@UseFilters(AdminErrorFilter)
@UseGuards(AdminSessionGuard)
export class MembershipsUiController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async list(
    @Req() req: any,
    @Res() res: Response,
    @Query('page') page = '1',
    @Query('q') q?: string,
    @Query('sort') sort = 'createdAt',
    @Query('dir') dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const [plans, subscriptions] = await Promise.all([
      this.membershipService.adminListPlans(),
      this.membershipService.adminListSubscriptions(Number(page) || 1, 20, q, sort, dir),
    ])
    res.render('memberships/list', {
      ...baseViewModel(req, res, 'Memberships', 'memberships'),
      plans,
      subscriptions,
      q: q || '',
      sort,
      dir,
    })
  }

  // ---------- Plans ----------

  @Get('plans/new')
  planForm(@Req() req: any, @Res() res: Response) {
    res.render('memberships/plan-form', { ...baseViewModel(req, res, 'Add Plan', 'memberships'), plan: null, errors: null })
  }

  @Post('plans/new')
  async createPlan(@Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      await this.membershipService.createPlan({
        code: body.code,
        name: body.name,
        price: Number(body.price),
        billingCycle: body.billingCycle,
        durationDays: body.durationDays ? Number(body.durationDays) : undefined,
        freeListingLimit: body.freeListingLimit ? Number(body.freeListingLimit) : undefined,
        isActive: body.isActive ? 1 : 0,
      })
      setFlash(res, this.config, 'Plan created')
      res.redirect('/admin/memberships')
    } catch (e: any) {
      res.render('memberships/plan-form', {
        ...baseViewModel(req, res, 'Add Plan', 'memberships'),
        plan: body,
        errors: e?.message || 'Could not create plan',
      })
    }
  }

  @Get('plans/:id/edit')
  async editPlanForm(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const plan = await this.membershipService.findPlan(Number(id))
    res.render('memberships/plan-form', { ...baseViewModel(req, res, 'Edit Plan', 'memberships'), plan, errors: null })
  }

  @Post('plans/:id/edit')
  async updatePlan(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      await this.membershipService.updatePlan(Number(id), {
        name: body.name,
        price: Number(body.price),
        billingCycle: body.billingCycle,
        durationDays: body.durationDays ? Number(body.durationDays) : null,
        freeListingLimit: body.freeListingLimit ? Number(body.freeListingLimit) : null,
        isActive: body.isActive ? 1 : 0,
      })
      setFlash(res, this.config, 'Plan updated')
      res.redirect('/admin/memberships')
    } catch (e: any) {
      res.render('memberships/plan-form', {
        ...baseViewModel(req, res, 'Edit Plan', 'memberships'),
        plan: { id, ...body },
        errors: e?.message || 'Could not update plan',
      })
    }
  }

  @Post('plans/:id/delete')
  async deletePlan(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.membershipService.deletePlan(Number(id))
      setFlash(res, this.config, 'Plan deleted')
    } catch (e: any) {
      setFlash(res, this.config, e?.message || 'Could not delete plan')
    }
    res.redirect('/admin/memberships')
  }

  // ---------- Subscriptions ----------

  @Get('subscriptions/new')
  async subscriptionForm(@Req() req: any, @Res() res: Response) {
    const plans = await this.membershipService.adminListPlans()
    res.render('memberships/subscription-form', {
      ...baseViewModel(req, res, 'Grant Subscription', 'memberships'),
      plans,
      errors: null,
      form: null,
    })
  }

  @Post('subscriptions/new')
  async createSubscription(@Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      const user = await this.membershipService.findUserByMobileOrEmail(body.userIdentifier)
      await this.membershipService.adminCreateSubscription({
        userId: user.id,
        planId: Number(body.planId),
        status: body.status || 'active',
        endDate: body.endDate ? new Date(body.endDate) : null,
        amount: body.amount ? Number(body.amount) : undefined,
        paymentReference: body.paymentReference || undefined,
      })
      setFlash(res, this.config, `Subscription granted to ${user.displayName || user.mobile || user.email}`)
      res.redirect('/admin/memberships')
    } catch (e: any) {
      const plans = await this.membershipService.adminListPlans()
      res.render('memberships/subscription-form', {
        ...baseViewModel(req, res, 'Grant Subscription', 'memberships'),
        plans,
        form: body,
        errors: e?.message || 'Could not grant subscription',
      })
    }
  }

  @Post('subscriptions/:id/cancel')
  async cancelSubscription(@Param('id') id: string, @Res() res: Response) {
    await this.membershipService.cancelSubscription(id)
    setFlash(res, this.config, 'Subscription cancelled')
    res.redirect('/admin/memberships')
  }

  @Post('subscriptions/bulk')
  async bulkCancel(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids)
    const result = await this.membershipService.bulkCancelSubscriptions(ids)
    setFlash(res, this.config, `${result.affected} subscription(s) cancelled`)
    res.redirect('/admin/memberships')
  }
}
