import { Body, Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { randomUUID } from 'crypto'
import { Response } from 'express'
import { ServiceInterestService } from '../../service-interest/service-interest.service'
import { AdminRedirectFilter } from '../admin-redirect.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { baseViewModel, parseIds, setFlash } from '../admin-ui.util'

/** Service-interest "leads" captured from the home page — support-team follow-up queue. */
@Controller('admin/leads')
@UseFilters(AdminRedirectFilter)
@UseGuards(AdminSessionGuard)
export class LeadsUiController {
  constructor(
    private readonly service: ServiceInterestService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async list(
    @Req() req: any,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('sort') sort = 'createdAt',
    @Query('dir') dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const data = await this.service.adminList(status || undefined, q, Number(page) || 1, 20, sort, dir)
    res.render('leads/list', {
      ...baseViewModel(req, res, 'Leads', 'leads'),
      data,
      statusFilter: status || '',
      q: q || '',
      sort,
      dir,
    })
  }

  @Get('new')
  newForm(@Req() req: any, @Res() res: Response) {
    res.render('leads/form', { ...baseViewModel(req, res, 'Log Lead', 'leads'), lead: null, errors: null })
  }

  @Post('new')
  async create(@Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      await this.service.adminCreate({
        sessionId: randomUUID(),
        serviceCode: body.serviceCode,
        serviceName: body.serviceName,
        mobile: body.mobile || undefined,
        sourcePage: 'admin_manual',
      })
      setFlash(res, this.config, 'Lead logged')
      res.redirect('/admin/leads')
    } catch (e: any) {
      res.render('leads/form', {
        ...baseViewModel(req, res, 'Log Lead', 'leads'),
        lead: body,
        errors: e?.message || 'Could not log lead',
      })
    }
  }

  @Post(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { contactStatus: string; notes?: string }, @Req() req: any, @Res() res: Response) {
    await this.service.updateStatus(Number(id), body, req.adminUser.id)
    setFlash(res, this.config, 'Lead updated')
    res.redirect('/admin/leads')
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.service.remove(Number(id))
    setFlash(res, this.config, 'Lead deleted')
    res.redirect('/admin/leads')
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids).map(Number)
    const result = await this.service.bulkRemove(ids)
    setFlash(res, this.config, `${result.affected} lead(s) deleted`)
    res.redirect('/admin/leads')
  }
}
