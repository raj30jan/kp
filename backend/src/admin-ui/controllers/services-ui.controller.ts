import { Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { ServiceService } from '../../services/service.service'
import { AdminErrorFilter } from '../admin-error.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { baseViewModel, setFlash } from '../admin-ui.util'

@Controller('admin/services')
@UseFilters(AdminErrorFilter)
@UseGuards(AdminSessionGuard)
export class ServicesUiController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async list(
    @Req() req: any,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('q') q?: string,
  ) {
    const data = await this.serviceService.adminList(status || undefined, Number(page) || 1, 20, q)
    res.render('services/list', {
      ...baseViewModel(req, res, 'Services', 'services'),
      data,
      statusFilter: status || '',
      q: q || '',
    })
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string, @Res() res: Response) {
    await this.serviceService.activate(id)
    setFlash(res, this.config, 'Service listing approved and is now live')
    res.redirect('/admin/services')
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Res() res: Response) {
    await this.serviceService.reject(id)
    setFlash(res, this.config, 'Service listing rejected')
    res.redirect('/admin/services')
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.serviceService.adminDelete(id)
      setFlash(res, this.config, 'Service listing erased')
    } catch (e: any) {
      setFlash(res, this.config, e?.message || 'Could not delete listing')
    }
    res.redirect('/admin/services')
  }
}
