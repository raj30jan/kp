import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { GuestLoginDto } from './dto/guest-login.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { SendOtpDto } from './dto/send-otp.dto'
import { SocialLoginDto } from './dto/social-login.dto'
import { VerifyOtpDto } from './dto/verify-otp.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('captcha')
  @ApiOperation({
    summary: 'Get a captcha challenge',
    description: 'Returns { captchaId, question }. Submit both with the register form.',
  })
  getCaptcha() {
    return this.authService.generateCaptcha()
  }

  @Post('otp/send')
  @ApiOperation({
    summary: 'Send OTP to a mobile number',
    description: 'Generates a 6-digit OTP valid for 5 minutes. In dev mode the OTP is returned in the response.',
  })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto)
  }

  @Post('otp/verify')
  @ApiOperation({
    summary: 'Verify mobile OTP',
    description: 'Marks the mobile as verified for 10 minutes so registration can proceed.',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto)
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Requires: name, email, verified mobile (OTP), password, address with GPS location, and a valid captcha.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with mobile + password', description: 'Returns a JWT access token.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('social')
  @ApiOperation({
    summary: 'Login/register via Google or Facebook',
    description:
      'Frontend performs client-side social sign-in and sends the resulting token here. Verifies the token, links/creates the user, and returns a JWT.',
  })
  socialLogin(@Body() dto: SocialLoginDto) {
    return this.authService.socialLogin(dto)
  }

  @Post('guest')
  @ApiOperation({
    summary: 'Guest login (mobile + OTP only)',
    description: 'Guest users only verify their mobile with OTP. Returns a JWT with role=guest.',
  })
  guestLogin(@Body() dto: GuestLoginDto) {
    return this.authService.guestLogin(dto)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout',
    description: 'Blacklists the current JWT in Redis until it expires.',
  })
  logout(@Req() req: any) {
    const token = req.headers.authorization.replace('Bearer ', '')
    return this.authService.logout(token)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Current user from JWT', description: 'Returns user profile with role and free-tier usage counters.' })
  me(@Req() req: any) {
    return this.authService.getProfile(req.user.userId)
  }
}
