import { Body, Controller, Get, Post, Req, Res, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FileInterceptor } from '@nestjs/platform-express'
import { Request, Response } from 'express'
import { AuthService } from '../auth/auth.service'
import { SettingsService, MEMBERSHIP_SETTING_KEYS } from '../settings/settings.service'
import { AdminUiService } from './admin-ui.service'
import { AdminSessionGuard } from './admin-session.guard'
import { SuperAdminSessionGuard } from './super-admin-session.guard'
import { AdminErrorFilter } from './admin-error.filter'
import { popFlash, cookieOpts, baseViewModel, setFlash } from './admin-ui.util'

/**
 * Backend Admin UI — SRS §3.3 Section 2: a server-side rendered (EJS) admin
 * panel at /admin/*. Handles auth (login/logout), the dashboard landing
 * page, and read-only settings. Per-module CRUD lives in dedicated
 * controllers (accounts-ui, products-ui, memberships-ui, complaints-ui,
 * leads-ui) that all reuse the exact same service classes as the Swagger
 * API layer — no duplicate business logic, no direct DB access here.
 */
@Controller('admin')
@UseFilters(AdminErrorFilter)
export class AdminUiController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminUiService: AdminUiService,
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
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
      const result: any = await this.authService.login({ identifier: body.identifier, password: body.password })

      // Second factor: password was correct but an OTP was emailed — park the
      // challenge id in a short-lived cookie and show the OTP page.
      if (result.otpRequired) {
        res.cookie('admin_login_challenge', result.challengeId, cookieOpts(this.config, 10 * 60 * 1000))
        res.cookie('admin_login_email', result.email || '', cookieOpts(this.config, 10 * 60 * 1000))
        if (result.devOtp) {
          res.cookie('admin_login_devotp', result.devOtp, cookieOpts(this.config, 10 * 60 * 1000))
        }
        return res.redirect('/admin/login/otp')
      }

      if (result.role !== 'admin' && result.role !== 'super_admin') {
        res.cookie('admin_flash', 'This account does not have admin access', cookieOpts(this.config, 5000))
        return res.redirect('/admin/login')
      }
      res.cookie('admin_token', result.accessToken, cookieOpts(this.config, 24 * 60 * 60 * 1000))
      res.cookie('admin_name', result.user.name || result.user.mobile || 'Admin', cookieOpts(this.config, 24 * 60 * 60 * 1000))
      return res.redirect('/admin')
    } catch (e: any) {
      res.cookie('admin_flash', e?.response?.message || 'Invalid email/mobile or password', cookieOpts(this.config, 5000))
      return res.redirect('/admin/login')
    }
  }

  @Get('login/otp')
  loginOtpPage(@Req() req: Request, @Res() res: Response) {
    if (!req.cookies?.admin_login_challenge) return res.redirect('/admin/login')
    res.render('login-otp', {
      error: popFlash(req, res),
      title: 'Verify OTP',
      email: req.cookies.admin_login_email || '',
      devOtp: req.cookies.admin_login_devotp || '',
    })
  }

  @Post('login/otp')
  async loginOtp(@Body() body: { otp: string }, @Req() req: Request, @Res() res: Response) {
    const challengeId = req.cookies?.admin_login_challenge
    if (!challengeId) return res.redirect('/admin/login')
    try {
      const result = await this.authService.verifyLoginOtp(challengeId, (body.otp || '').trim())
      if (result.role !== 'admin' && result.role !== 'super_admin') {
        res.clearCookie('admin_login_challenge')
        res.cookie('admin_flash', 'This account does not have admin access', cookieOpts(this.config, 5000))
        return res.redirect('/admin/login')
      }
      res.clearCookie('admin_login_challenge')
      res.clearCookie('admin_login_email')
      res.clearCookie('admin_login_devotp')
      res.cookie('admin_token', result.accessToken, cookieOpts(this.config, 24 * 60 * 60 * 1000))
      res.cookie('admin_name', result.user.name || result.user.mobile || 'Admin', cookieOpts(this.config, 24 * 60 * 60 * 1000))
      return res.redirect('/admin')
    } catch (e: any) {
      res.cookie('admin_flash', e?.response?.message || 'Invalid or expired OTP', cookieOpts(this.config, 5000))
      return res.redirect('/admin/login/otp')
    }
  }

  @Post('login/resend-otp')
  async loginResendOtp(@Req() req: Request, @Res() res: Response) {
    const challengeId = req.cookies?.admin_login_challenge
    if (!challengeId) return res.redirect('/admin/login')
    try {
      const result = await this.authService.resendLoginOtp(challengeId)
      res.cookie('admin_login_challenge', result.challengeId, cookieOpts(this.config, 10 * 60 * 1000))
      res.cookie('admin_login_email', result.email || '', cookieOpts(this.config, 10 * 60 * 1000))
      if ((result as any).devOtp) {
        res.cookie('admin_login_devotp', (result as any).devOtp, cookieOpts(this.config, 10 * 60 * 1000))
      }
      res.cookie('admin_flash', 'A new OTP has been emailed to you', cookieOpts(this.config, 5000))
    } catch (e: any) {
      res.cookie('admin_flash', e?.response?.message || 'Could not resend OTP', cookieOpts(this.config, 5000))
    }
    return res.redirect('/admin/login/otp')
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
  async settingsPage(@Req() req: any, @Res() res: Response) {
    const payment = await this.settings.getMany(MEMBERSHIP_SETTING_KEYS)
    res.render('settings', {
      ...baseViewModel(req, res, 'Settings', 'settings'),
      payment,
      isSuperAdmin: req.adminUser?.role === 'super_admin',
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

  /**
   * Super-admin only: upload the membership payment QR code and UPI
   * details shown to members on the public /membership page.
   */
  @Post('settings/membership-payment')
  @UseGuards(SuperAdminSessionGuard)
  @UseInterceptors(FileInterceptor('qr', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async saveMembershipPayment(
    @UploadedFile() qr: any,
    @Body() body: { upiId?: string; payeeName?: string; note?: string; removeQr?: string },
    @Req() req: any,
    @Res() res: Response,
  ) {
    const adminId = req.adminUser?.id
    try {
      if (body.removeQr === '1') {
        await this.settings.removeMembershipQr(adminId)
      } else if (qr?.buffer) {
        await this.settings.saveMembershipQr(qr, adminId)
      }
      await this.settings.set('membership_upi_id', (body.upiId || '').trim() || null, adminId)
      await this.settings.set('membership_payee_name', (body.payeeName || '').trim() || 'KisanPatrika', adminId)
      await this.settings.set('membership_payment_note', (body.note || '').trim() || null, adminId)
      setFlash(res, this.config, 'Membership payment details saved')
    } catch (e: any) {
      setFlash(res, this.config, e?.message || 'Could not save payment settings')
    }
    res.redirect('/admin/settings')
  }
}
