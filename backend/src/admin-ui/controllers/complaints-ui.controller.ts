import { Body, Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { ComplaintsService } from '../../complaints/complaints.service'
import { AdminRedirectFilter } from '../admin-redirect.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { baseViewModel, parseIds, setFlash } from '../admin-ui.util'

@Controller('admin/complaints')
@UseFilters(AdminRedirectFilter)
@UseGuards(AdminSessionGuard)
export class ComplaintsUiController {
  constructor(
    private readonly complaintsService: ComplaintsService,
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
    const data = await this.complaintsService.adminList(status || undefined, q, Number(page) || 1, 20, sort, dir)
    res.render('complaints/list', {
      ...baseViewModel(req, res, 'Complaints', 'complaints'),
      data,
      statusFilter: status || '',
      q: q || '',
      sort,
      dir,
    })
  }

  @Get('new')
  newForm(@Req() req: any, @Res() res: Response) {
    res.render('complaints/form', { ...baseViewModel(req, res, 'Log Complaint', 'complaints'), complaint: null, errors: null })
  }

  @Post('new')
  async create(@Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      await this.complaintsService.adminCreate({
        category: body.category,
        subject: body.subject,
        description: body.description,
        contactMobile: body.contactMobile || undefined,
        contactEmail: body.contactEmail || undefined,
      })
      setFlash(res, this.config, 'Complaint logged')
      res.redirect('/admin/complaints')
    } catch (e: any) {
      res.render('complaints/form', {
        ...baseViewModel(req, res, 'Log Complaint', 'complaints'),
        complaint: body,
        errors: e?.message || 'Could not log complaint',
      })
    }
  }

  @Get(':id/edit')
  async editForm(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const complaint = await this.complaintsService.findOne(id)
    res.render('complaints/form', { ...baseViewModel(req, res, 'Edit Complaint', 'complaints'), complaint, errors: null })
  }

  @Post(':id/edit')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      await this.complaintsService.updateDetails(id, {
        category: body.category,
        subject: body.subject,
        description: body.description,
        contactMobile: body.contactMobile || undefined,
        contactEmail: body.contactEmail || undefined,
      })
      setFlash(res, this.config, 'Complaint updated')
      res.redirect('/admin/complaints')
    } catch (e: any) {
      res.render('complaints/form', {
        ...baseViewModel(req, res, 'Edit Complaint', 'complaints'),
        complaint: { id, ...body },
        errors: e?.message || 'Could not update complaint',
      })
    }
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; resolutionNote?: string },
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      await this.complaintsService.updateStatus(id, { status: body.status as any, resolutionNote: body.resolutionNote }, req.adminUser.id)
      setFlash(res, this.config, 'Complaint updated')
    } catch (e: any) {
      setFlash(res, this.config, e?.message || 'Could not update complaint')
    }
    res.redirect('/admin/complaints')
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.complaintsService.remove(id)
    setFlash(res, this.config, 'Complaint deleted')
    res.redirect('/admin/complaints')
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids)
    const result = await this.complaintsService.bulkRemove(ids)
    setFlash(res, this.config, `${result.affected} complaint(s) deleted`)
    res.redirect('/admin/complaints')
  }
}
