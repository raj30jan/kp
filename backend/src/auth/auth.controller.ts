import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { GuestLoginDto } from './dto/guest-login.dto'
import { LoginDto } from './dto/login.dto'
import { ResendLoginOtpDto, VerifyLoginOtpDto } from './dto/login-otp.dto'
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
  @ApiOperation({
    summary: 'Login step 1: email/mobile + password',
    description:
      'If the password is correct an OTP is emailed to the registered address and `{ otpRequired: true, challengeId }` is returned. ' +
      'Complete login with POST /auth/login/verify-otp. (Returns a JWT directly only when LOGIN_OTP_REQUIRED=false.)',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('login/verify-otp')
  @ApiOperation({ summary: 'Login step 2: verify emailed OTP', description: 'Returns the JWT access token.' })
  verifyLoginOtp(@Body() dto: VerifyLoginOtpDto) {
    return this.authService.verifyLoginOtp(dto.challengeId, dto.otp)
  }

  @Post('login/resend-otp')
  @ApiOperation({ summary: 'Re-send the login OTP for an existing challenge (60s throttle)' })
  resendLoginOtp(@Body() dto: ResendLoginOtpDto) {
    return this.authService.resendLoginOtp(dto.challengeId)
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
