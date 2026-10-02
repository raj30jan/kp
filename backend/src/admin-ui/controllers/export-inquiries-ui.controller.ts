import { Body, Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { ExportInquiryService } from '../../export-import/export-inquiry.service'
import { AdminErrorFilter } from '../admin-error.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { baseViewModel, parseIds, setFlash } from '../admin-ui.util'

/** Export/import trade inquiries captured from /export-import — support-team follow-up queue. */
@Controller('admin/export-inquiries')
@UseFilters(AdminErrorFilter)
@UseGuards(AdminSessionGuard)
export class ExportInquiriesUiController {
  constructor(
    private readonly service: ExportInquiryService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async list(
    @Req() req: any,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('direction') direction?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('sort') sort = 'createdAt',
    @Query('dir') dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const data = await this.service.adminList(
      status || undefined,
      direction || undefined,
      q,
      Number(page) || 1,
      20,
      sort,
      dir,
    )
    res.render('export-inquiries/list', {
      ...baseViewModel(req, res, 'Export & Import Inquiries', 'export-inquiries'),
      data,
      statusFilter: status || '',
      directionFilter: direction || '',
      q: q || '',
      sort,
      dir,
    })
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { contactStatus: string; notes?: string },
    @Req() req: any,
    @Res() res: Response,
  ) {
    await this.service.updateStatus(Number(id), body, req.adminUser.id)
    setFlash(res, this.config, 'Inquiry updated')
    res.redirect('/admin/export-inquiries')
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.service.remove(Number(id))
    setFlash(res, this.config, 'Inquiry deleted')
    res.redirect('/admin/export-inquiries')
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids).map(Number)
    const result = await this.service.bulkRemove(ids)
    setFlash(res, this.config, `${result.affected} inquiry(ies) deleted`)
    res.redirect('/admin/export-inquiries')
  }
}
