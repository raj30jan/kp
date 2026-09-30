import { Body, Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { AdminAnimalsService } from '../../admin-animals/admin-animals.service'
import { AdminErrorFilter } from '../admin-error.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { baseViewModel, parseIds, setFlash } from '../admin-ui.util'

/**
 * Server-rendered approval queue for animal listings — /admin/animals.
 * Mirrors the products moderation screen: search, status filter, approve /
 * reject / erase per row, bulk actions, pagination.
 */
@Controller('admin/animals')
@UseFilters(AdminErrorFilter)
@UseGuards(AdminSessionGuard)
export class AnimalsUiController {
  constructor(
    private readonly animals: AdminAnimalsService,
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
    const data = await this.animals.list(status || 'all', Number(page) || 1, 20, q)
    res.render('animals/list', {
      ...baseViewModel(req, res, 'Animal Listings', 'animals'),
      data,
      statusFilter: status || '',
      q: q || '',
    })
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string, @Res() res: Response) {
    await this.animals.activate(id)
    setFlash(res, this.config, 'Animal listing approved and is now live')
    res.redirect('/admin/animals')
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Res() res: Response) {
    await this.animals.reject(id)
    setFlash(res, this.config, 'Animal listing rejected')
    res.redirect('/admin/animals')
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.animals.remove(id)
      setFlash(res, this.config, 'Listing deleted — photos and video removed')
    } catch (e: any) {
      setFlash(res, this.config, e?.message || 'Could not delete listing')
    }
    res.redirect('/admin/animals')
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids)
    const result = await this.animals.bulkAction(ids, body.action)
    let msg = `${result.affected} listing(s) updated`
    if (result.errors?.length) {
      msg += `. Skipped: ${result.errors.join('; ')}`
    }
    setFlash(res, this.config, msg)
    res.redirect('/admin/animals')
  }
}
