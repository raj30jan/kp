import { Body, Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { AdminUsersService } from '../../admin-users/admin-users.service'
import { AdminErrorFilter } from '../admin-error.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { SuperAdminSessionGuard } from '../super-admin-session.guard'
import { baseViewModel, parseIds, setFlash } from '../admin-ui.util'

/**
 * User account management — mounted at /admin/accounts (not /admin/users)
 * to avoid colliding with the existing /admin/users REST API
 * (AdminUsersController), which stays under /api/v1 for the Next.js frontend.
 */
@Controller('admin/accounts')
@UseFilters(AdminErrorFilter)
@UseGuards(AdminSessionGuard)
export class AccountsUiController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async list(
    @Req() req: any,
    @Res() res: Response,
    @Query('role') role?: string,
    @Query('page') page = '1',
    @Query('q') q?: string,
    @Query('sort') sort = 'createdAt',
    @Query('dir') dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const data = await this.adminUsersService.findAll(role || undefined, Number(page) || 1, 20, q, sort, dir)
    res.render('accounts/list', {
      ...baseViewModel(req, res, 'Users', 'users'),
      data,
      roleFilter: role || '',
      q: q || '',
      sort,
      dir,
    })
  }

  @Get('new')
  @UseGuards(SuperAdminSessionGuard)
  newForm(@Req() req: any, @Res() res: Response) {
    res.render('accounts/form', { ...baseViewModel(req, res, 'Add User', 'users'), user: null, errors: null })
  }

  @Post('new')
  @UseGuards(SuperAdminSessionGuard)
  async create(@Body() body: any, @Res() res: Response, @Req() req: any) {
    try {
      await this.adminUsersService.create({
        email: body.email || undefined,
        mobile: body.mobile || undefined,
        password: body.password,
        displayName: body.displayName || undefined,
        role: body.role || 'user',
      })
      setFlash(res, this.config, 'User created')
      res.redirect('/admin/accounts')
    } catch (e: any) {
      res.render('accounts/form', {
        ...baseViewModel(req, res, 'Add User', 'users'),
        user: body,
        errors: e?.message || 'Could not create user',
      })
    }
  }

  @Get(':id/edit')
  async editForm(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const user = await this.adminUsersService.findOne(id)
    res.render('accounts/form', { ...baseViewModel(req, res, 'Edit User', 'users'), user, errors: null })
  }

  @Post(':id/edit')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      const dto: any = { displayName: body.displayName, isActive: body.isActive ? 1 : 0 }
      if (req.adminUser.role === 'super_admin' && body.role) dto.role = body.role
      await this.adminUsersService.update(id, dto)
      setFlash(res, this.config, 'User updated')
      res.redirect('/admin/accounts')
    } catch (e: any) {
      const user = await this.adminUsersService.findOne(id).catch(() => null)
      res.render('accounts/form', {
        ...baseViewModel(req, res, 'Edit User', 'users'),
        user: user || { id, ...body },
        errors: e?.message || 'Could not update user',
      })
    }
  }

  @Post(':id/toggle-active')
  async toggleActive(@Param('id') id: string, @Res() res: Response) {
    const user = await this.adminUsersService.findOne(id)
    await this.adminUsersService.update(id, { isActive: user.isActive ? 0 : 1 })
    setFlash(res, this.config, 'User status updated')
    res.redirect('/admin/accounts')
  }

  @Post(':id/delete')
  @UseGuards(SuperAdminSessionGuard)
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.adminUsersService.remove(id)
    setFlash(res, this.config, 'User deleted')
    res.redirect('/admin/accounts')
  }

  @Post('bulk')
  @UseGuards(SuperAdminSessionGuard)
  async bulk(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids)
    const action = body.action as 'activate' | 'deactivate' | 'delete'
    const result = await this.adminUsersService.bulkAction(ids, action)
    setFlash(res, this.config, `${result.affected} user(s) updated`)
    res.redirect('/admin/accounts')
  }
}
