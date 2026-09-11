import { Body, Controller, Get, Post, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'
import { AuthService } from '../auth/auth.service'
import { AdminUiService } from './admin-ui.service'
import { AdminSessionGuard } from './admin-session.guard'
import { AdminRedirectFilter } from './admin-redirect.filter'
import { popFlash, cookieOpts, baseViewModel } from './admin-ui.util'

/**
 * Backend Admin UI — SRS §3.3 Section 2: a server-side rendered (EJS) admin
 * panel at /admin/*. Handles auth (login/logout), the dashboard landing
 * page, and read-only settings. Per-module CRUD lives in dedicated
 * controllers (accounts-ui, products-ui, memberships-ui, complaints-ui,
 * leads-ui) that all reuse the exact same service classes as the Swagger
 * API layer — no duplicate business logic, no direct DB access here.
 */
@Controller('admin')
@UseFilters(AdminRedirectFilter)
export class AdminUiController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminUiService: AdminUiService,
    private readonly config: ConfigService,
  ) {}

  // ============ AUTH ============

  @Get('login')
  loginPage(@Req() req: Request, @Res() res: Response) {
    if (req.cookies?.admin_token) return res.redirect('/admin')
    res.render('login', { error: popFlash(req, res), title: 'Admin Login' })
  }

  @Post('login')
  async login(@Body() body: { identifier: string; password: string }, @Res() res: Response) {
    try {
      const result = await this.authService.login({ identifier: body.identifier, password: body.password })
      if (result.role !== 'admin' && result.role !== 'super_admin') {
        res.cookie('admin_flash', 'This account does not have admin access', cookieOpts(this.config, 5000))
        return res.redirect('/admin/login')
      }
      res.cookie('admin_token', result.accessToken, cookieOpts(this.config, 24 * 60 * 60 * 1000))
      res.cookie('admin_name', result.user.name || result.user.mobile || 'Admin', cookieOpts(this.config, 24 * 60 * 60 * 1000))
      return res.redirect('/admin')
    } catch {
      res.cookie('admin_flash', 'Invalid email/mobile or password', cookieOpts(this.config, 5000))
      return res.redirect('/admin/login')
    }
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('admin_token')
    res.clearCookie('admin_name')
    res.redirect('/admin/login')
  }

  // ============ DASHBOARD ============

  @Get()
  @UseGuards(AdminSessionGuard)
  async dashboard(@Req() req: any, @Res() res: Response) {
    const stats = await this.adminUiService.getDashboardStats()
    res.render('dashboard', { ...baseViewModel(req, res, 'Dashboard', 'dashboard'), stats })
  }

  // ============ SETTINGS ============

  @Get('settings')
  @UseGuards(AdminSessionGuard)
  settings(@Req() req: any, @Res() res: Response) {
    res.render('settings', {
      ...baseViewModel(req, res, 'Settings', 'settings'),
      env: {
        NODE_ENV: this.config.get('NODE_ENV'),
        PORT: this.config.get('PORT'),
        MYSQL_HOST: this.config.get('MYSQL_HOST'),
        MYSQL_DATABASE: this.config.get('MYSQL_DATABASE'),
        MONGO_ENABLED: this.config.get('MONGO_ENABLED'),
        REDIS_HOST: this.config.get('REDIS_HOST'),
        JWT_EXPIRES_IN: this.config.get('JWT_EXPIRES_IN'),
        PRODUCT_ACTIVE_DAYS: this.config.get('PRODUCT_ACTIVE_DAYS'),
      },
    })
  }
}
