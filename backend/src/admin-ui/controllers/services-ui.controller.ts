import { Body, Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { ServiceService } from '../../services/service.service'
import { SERVICE_TYPES, RATE_UNITS } from '../../services/dto/service.dto'
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
    @Query('type') type?: string,
    @Query('page') page = '1',
    @Query('q') q?: string,
  ) {
    const data = await this.serviceService.adminList(status || undefined, Number(page) || 1, 20, q, type || undefined)
    res.render('services/list', {
      ...baseViewModel(req, res, 'Services', 'services'),
      data,
      statusFilter: status || '',
      typeFilter: type || '',
      q: q || '',
      serviceTypes: SERVICE_TYPES,
    })
  }

  @Get('new')
  newForm(@Req() req: any, @Res() res: Response) {
    res.render('services/form', {
      ...baseViewModel(req, res, 'Add Professional', 'services'),
      svc: null,
      errors: null,
      serviceTypes: SERVICE_TYPES,
      rateUnits: RATE_UNITS,
    })
  }

  @Post('new')
  async create(@Req() req: any, @Body() body: any, @Res() res: Response) {
    try {
      await this.serviceService.adminCreate(this.cleanBody(body))
      setFlash(res, this.config, 'Professional added and is now live')
      return res.redirect('/admin/services')
    } catch (e: any) {
      return res.render('services/form', {
        ...baseViewModel(req, res, 'Add Professional', 'services'),
        svc: body,
        errors: e?.message || 'Could not add professional',
        serviceTypes: SERVICE_TYPES,
        rateUnits: RATE_UNITS,
      })
    }
  }

  @Get(':id')
  async view(@Req() req: any, @Res() res: Response, @Param('id') id: string) {
    const svc = await this.serviceService.adminFindOne(id)
    res.render('services/view', {
      ...baseViewModel(req, res, svc.title || 'Service', 'services'),
      svc,
    })
  }

  @Get(':id/edit')
  async editForm(@Req() req: any, @Res() res: Response, @Param('id') id: string) {
    const svc = await this.serviceService.adminFindOne(id)
    res.render('services/form', {
      ...baseViewModel(req, res, `Edit — ${svc.title}`, 'services'),
      svc,
      errors: null,
      serviceTypes: SERVICE_TYPES,
      rateUnits: RATE_UNITS,
    })
  }

  @Post(':id/edit')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any, @Res() res: Response) {
    try {
      await this.serviceService.adminUpdate(id, this.cleanBody(body))
      setFlash(res, this.config, 'Listing updated')
      return res.redirect(`/admin/services/${id}`)
    } catch (e: any) {
      return res.render('services/form', {
        ...baseViewModel(req, res, `Edit — ${body.title || 'Service'}`, 'services'),
        svc: { id, ...body },
        errors: e?.message || 'Could not update listing',
        serviceTypes: SERVICE_TYPES,
        rateUnits: RATE_UNITS,
      })
    }
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

  @Post(':id/disqualify')
  async disqualify(@Param('id') id: string, @Res() res: Response) {
    await this.serviceService.disqualify(id)
    setFlash(res, this.config, 'Listing disqualified and taken offline')
    res.redirect('/admin/services')
  }

  @Post(':id/qualify')
  async qualify(@Param('id') id: string, @Res() res: Response) {
    await this.serviceService.qualify(id)
    setFlash(res, this.config, 'Listing sent back to pending for review')
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

  /** Coerce the flat form body into the DTO shape (numbers, empty->undefined). */
  private cleanBody(body: any) {
    const out: any = {}
    for (const [k, v] of Object.entries(body || {})) {
      if (v === '' || v == null) continue
      out[k] = v
    }
    for (const k of ['rate', 'experienceYears', 'latitude', 'longitude']) {
      if (out[k] != null) {
        const n = Number(out[k])
        out[k] = Number.isFinite(n) ? n : undefined
      }
    }
    return out
  }
}
