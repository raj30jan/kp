import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { randomBytes, randomInt } from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { Repository } from 'typeorm'
import { StatusMaster } from '../common/entities/status-master.entity'
import { MailService } from '../common/mail.service'
import { ActivityLogService } from '../mongo/activity-log.service'
import { DataSyncService } from '../mongo/data-sync.service'
import { RedisService } from '../redis/redis.service'
import { Address } from '../users/entities/address.entity'
import { EntityAddress } from '../users/entities/entity-address.entity'
import { State } from '../location/entities/state.entity'
import { District } from '../location/entities/district.entity'
import { City } from '../location/entities/city.entity'
import { User } from '../users/entities/user.entity'
import { UserSocialAccount } from '../users/entities/user-social-account.entity'
import { GuestLoginDto } from './dto/guest-login.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { SendOtpDto } from './dto/send-otp.dto'
import { SocialLoginDto } from './dto/social-login.dto'
import { VerifyOtpDto } from './dto/verify-otp.dto'

/** "rajinder@example.com" -> "ra*****@example.com" for on-screen hints. */
function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${'*'.repeat(Math.max(local.length - visible.length, 3))}@${domain}`
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Address) private readonly addressRepo: Repository<Address>,
    @InjectRepository(EntityAddress) private readonly entityAddressRepo: Repository<EntityAddress>,
    @InjectRepository(StatusMaster) private readonly statusRepo: Repository<StatusMaster>,
    @InjectRepository(UserSocialAccount) private readonly socialRepo: Repository<UserSocialAccount>,
    @InjectRepository(State) private readonly stateRepo: Repository<State>,
    @InjectRepository(District) private readonly districtRepo: Repository<District>,
    @InjectRepository(City) private readonly cityRepo: Repository<City>,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly activityLog: ActivityLogService,
    private readonly mail: MailService,
    private readonly dataSync: DataSyncService,
  ) {}

  // ============ CAPTCHA ============
  /**
   * Generates a simple math captcha (e.g. "7 + 5 = ?").
   * The answer is stored in Redis for 5 minutes under captcha:<id>.
   * The frontend shows the question; the user submits id + answer at register.
   */
  async generateCaptcha() {
    const a = randomInt(1, 10)
    const b = randomInt(1, 10)
    const captchaId = randomBytes(8).toString('hex')
    await this.redis.set(`captcha:${captchaId}`, String(a + b), 300)
    return { captchaId, question: `${a} + ${b} = ?` }
  }

  /** Public: also used by the contact-us endpoint to verify the same math captcha. */
  async validateCaptcha(captchaId?: string, answer?: string) {
    if (!captchaId || !answer) {
      throw new BadRequestException('Captcha is required')
    }
    const expected = await this.redis.get(`captcha:${captchaId}`)
    if (!expected || expected !== answer) {
      throw new BadRequestException('Invalid or expired captcha')
    }
    await this.redis.del(`captcha:${captchaId}`) // one-time use
  }

  // ============ OTP ============
  /**
   * Generates a 6-digit OTP, stores in Redis with TTL.
   * SMS gateway is NOT integrated yet — OTP is delivered via EMAIL only.
   * TODO: when an SMS provider (MSG91/Twilio) is purchased, also send to mobile here.
   * In dev mode the OTP is returned in the response.
   */
  async sendOtp(dto: SendOtpDto) {
    if (!dto.email) {
      throw new BadRequestException(
        'Email is required — OTP is currently sent via email only (SMS coming soon)',
      )
    }

    const otp = String(randomInt(100000, 999999))
    const ttl = this.config.get<number>('OTP_TTL_SECONDS', 300)
    await this.redis.set(`otp:${dto.mobile}`, otp, ttl)

    // Email is the ONLY delivery channel until SMS is integrated
    let emailSent = false
    try {
      emailSent = await this.mail.sendOtpEmail(dto.email, otp, ttl)
    } catch {
      emailSent = false
    }
    if (!emailSent) {
      throw new BadRequestException(
        'Could not send OTP email — please check the email address and try again',
      )
    }

    this.activityLog.log({
      action: 'otp.send',
      mobile: dto.mobile,
      meta: { email: dto.email, emailSent },
    })

    const devMode = this.config.get('OTP_DEV_MODE') === 'true' || this.config.get('OTP_DEV_MODE') === true
    return {
      message: `OTP sent to ${dto.email}`,
      expiresInSeconds: ttl,
      emailSent,
      ...(devMode ? { devOtp: otp } : {}),
    }
  }

  /**
   * Verifies OTP. On success, marks the mobile as verified for 10 minutes
   * so the /register or /guest call can complete.
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const stored = await this.redis.get(`otp:${dto.mobile}`)
    if (!stored || stored !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP')
    }
    await this.redis.del(`otp:${dto.mobile}`)
    await this.redis.set(`otp-verified:${dto.mobile}`, '1', 600)
    this.activityLog.log({ action: 'otp.verify', mobile: dto.mobile })
    return { message: 'Mobile verified successfully', verifiedForSeconds: 600 }
  }

  private async assertMobileVerified(mobile: string) {
    const verified = await this.redis.exists(`otp-verified:${mobile}`)
    if (!verified) {
      throw new BadRequestException('Mobile not verified. Call /auth/otp/send and /auth/otp/verify first.')
    }
  }

  // ============ REGISTER ============
  async register(dto: RegisterDto) {
    // OTP gate — disabled until production go-live (OTP_REQUIRED=true re-enables it)
    const otpRequired = this.config.get('OTP_REQUIRED') === 'true'

    // 1. Captcha must always be valid — protects registration from bots
    await this.validateCaptcha(dto.captchaId, dto.captchaAnswer)

    // 2. Mobile must be OTP-verified (only when OTP flow is on)
    if (otpRequired) {
      await this.assertMobileVerified(dto.mobile)
    }

    // 3. No duplicate email/mobile
    const existing = await this.userRepo.findOne({
      where: [{ mobile: dto.mobile }, { email: dto.email }],
    })
    if (existing) {
      throw new ConflictException('A user with this mobile or email already exists')
    }

    // 4. Look up status_id from status_master ('user','active')
    const activeStatus = await this.statusRepo.findOneByOrFail({
      entityType: 'user',
      code: 'active',
    })

    // 5. Create user with bcrypt-hashed password
    const user = this.userRepo.create({
      email: dto.email,
      mobile: dto.mobile,
      displayName: dto.name,
      passwordHash: await bcrypt.hash(dto.password, 10),
      statusId: activeStatus.id,
      isVerified: 1,
      mobileVerifiedAt: new Date(),
      termsAcceptedAt: dto.acceptTerms ? new Date() : null,
    })
    await this.userRepo.save(user)

    // Mirror the new user to MongoDB + Redis in parallel (SRS §3.5)
    await this.dataSync.mirror({
      entity: 'user',
      refId: user.id,
      payload: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        displayName: user.displayName,
        isVerified: user.isVerified,
      },
      mobile: user.mobile || undefined,
      userId: user.id,
    })

    // 6. Save address (master) + link to user (detail)
    const address = this.addressRepo.create({
      line1: dto.addressLine1,
      line2: dto.addressLine2 ?? null,
      countryId: Number(dto.countryId) || null,
      stateId: Number(dto.stateId) || null,
      cityId: Number(dto.cityId) || null,
      latitude: dto.latitude != null ? String(dto.latitude) : null,
      longitude: dto.longitude != null ? String(dto.longitude) : null,
      addressType: 'home',
      isPrimary: 1,
      statusId: activeStatus.id,
    })
    await this.addressRepo.save(address)
    await this.entityAddressRepo.save(
      this.entityAddressRepo.create({
        entityType: 'user',
        entityId: user.id,
        addressId: address.id,
        isPrimary: 1,
        statusId: activeStatus.id,
      }),
    )

    // 7. Cleanup verified flag and issue JWT
    await this.redis.del(`otp-verified:${dto.mobile}`)
    this.activityLog.log({ action: 'auth.register', userId: user.id, mobile: dto.mobile })
    return this.issueToken(user)
  }

  // ============ LOGIN ============
  /**
   * Step 1 of login: email (or mobile) + password. On success, when
   * LOGIN_OTP_REQUIRED is on (default), we do NOT issue a token yet — we
   * email a 6-digit OTP to the account's registered address and return a
   * short-lived `challengeId`. The client then calls `verifyLoginOtp`.
   * When the flag is off (local dev), a token is returned immediately.
   */
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: [{ email: dto.identifier }, { mobile: dto.identifier }],
    })
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password')
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash)
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password')
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated')
    }

    if (!this.loginOtpRequired) {
      this.activityLog.log({ action: 'auth.login', userId: user.id, mobile: user.mobile || undefined })
      return this.issueToken(user)
    }
    return this.startLoginOtpChallenge(user)
  }

  private get loginOtpRequired(): boolean {
    const v = this.config.get('LOGIN_OTP_REQUIRED')
    // Default ON — only an explicit "false" disables the second factor.
    return !(v === 'false' || v === false)
  }

  private get otpDevMode(): boolean {
    const v = this.config.get('OTP_DEV_MODE')
    return v === 'true' || v === true
  }

  /** Creates the Redis-backed OTP challenge and emails the code. */
  private async startLoginOtpChallenge(user: User) {
    if (!user.email) {
      throw new BadRequestException(
        'Your account has no email address, so the login OTP cannot be delivered. Please contact support.',
      )
    }
    // Rate-limit: one challenge per user per 60s to stop email bombing.
    const throttleKey = `login-otp-throttle:${user.id}`
    if (await this.redis.exists(throttleKey)) {
      throw new BadRequestException('An OTP was just sent. Please wait a minute before requesting another.')
    }

    const challengeId = randomBytes(24).toString('hex')
    const otp = String(randomInt(100000, 999999))
    const ttl = this.config.get<number>('OTP_TTL_SECONDS', 300)
    await this.redis.set(`login-otp:${challengeId}`, JSON.stringify({ userId: user.id, otp, attempts: 0 }), ttl)
    await this.redis.set(throttleKey, '1', 60)

    let emailSent = false
    try {
      emailSent = await this.mail.sendLoginOtpEmail(user.email, otp, ttl, user.displayName || undefined)
    } catch {
      emailSent = false
    }
    if (!emailSent && !this.otpDevMode) {
      await this.redis.del(`login-otp:${challengeId}`)
      throw new BadRequestException('Could not send the login OTP email — please try again in a moment')
    }

    this.activityLog.log({ action: 'auth.login.otp_sent', userId: user.id, meta: { emailSent } })
    return {
      otpRequired: true as const,
      challengeId,
      expiresIn: ttl,
      email: maskEmail(user.email),
      message: `An OTP has been sent to ${maskEmail(user.email)}`,
      ...(this.otpDevMode ? { devOtp: otp } : {}),
    }
  }

  /**
   * Step 2 of login: verify the emailed OTP against the challenge and issue
   * the JWT. Max 5 wrong attempts per challenge, then it is invalidated.
   */
  async verifyLoginOtp(challengeId: string, otp: string) {
    const key = `login-otp:${challengeId}`
    const raw = await this.redis.get(key)
    if (!raw) throw new UnauthorizedException('OTP expired or invalid. Please log in again.')

    const data = JSON.parse(raw) as { userId: string; otp: string; attempts: number }
    if (data.otp !== otp) {
      data.attempts += 1
      if (data.attempts >= 5) {
        await this.redis.del(key)
        throw new UnauthorizedException('Too many wrong attempts. Please log in again.')
      }
      // Preserve remaining TTL semantics approximately — re-set with default ttl.
      await this.redis.set(key, JSON.stringify(data), this.config.get<number>('OTP_TTL_SECONDS', 300))
      throw new UnauthorizedException(`Incorrect OTP. ${5 - data.attempts} attempt(s) left.`)
    }

    await this.redis.del(key)
    const user = await this.userRepo.findOne({ where: { id: data.userId } })
    if (!user || !user.isActive) throw new UnauthorizedException('Account not available')

    this.activityLog.log({ action: 'auth.login', userId: user.id, mobile: user.mobile || undefined, meta: { otp: true } })
    return this.issueToken(user)
  }

  /** Re-send the OTP for an existing (unexpired) challenge. */
  async resendLoginOtp(challengeId: string) {
    const raw = await this.redis.get(`login-otp:${challengeId}`)
    if (!raw) throw new UnauthorizedException('OTP session expired. Please log in again.')
    const data = JSON.parse(raw) as { userId: string }
    const user = await this.userRepo.findOne({ where: { id: data.userId } })
    if (!user) throw new UnauthorizedException('Account not available')
    // Check the throttle BEFORE discarding the current challenge, otherwise a
    // resend inside the 60s window would leave the user with no valid OTP.
    if (await this.redis.exists(`login-otp-throttle:${user.id}`)) {
      throw new BadRequestException('An OTP was just sent. Please wait a minute before requesting another.')
    }
    await this.redis.del(`login-otp:${challengeId}`)
    return this.startLoginOtpChallenge(user)
  }

  // ============ GUEST ============
  /**
   * Guest login: OTP-only, no password. If no user exists for the
   * mobile, a minimal guest account is created.
   */
  async guestLogin(dto: GuestLoginDto) {
    const stored = await this.redis.get(`otp:${dto.mobile}`)
    if (!stored || stored !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP')
    }
    await this.redis.del(`otp:${dto.mobile}`)

    let user = await this.userRepo.findOne({ where: { mobile: dto.mobile } })
    if (!user) {
      const activeStatus = await this.statusRepo.findOneByOrFail({
        entityType: 'user',
        code: 'active',
      })
      user = this.userRepo.create({
        mobile: dto.mobile,
        displayName: `Guest ${dto.mobile.slice(-4)}`,
        statusId: activeStatus.id,
        isVerified: 1,
        mobileVerifiedAt: new Date(),
      })
      await this.userRepo.save(user)
    }
    this.activityLog.log({ action: 'auth.guest', userId: user.id, mobile: dto.mobile })
    return this.issueToken(user, 'guest')
  }

  // ============ SOCIAL LOGIN ============
  /**
   * Login/registration via Google or Facebook. The frontend performs the
   * client-side sign-in (Google Identity Services / Facebook Login SDK) and
   * hands us the resulting token; we verify it server-side, then:
   *   - If this provider identity is already linked (`user_social_accounts`),
   *     log that user in.
   *   - Else if a user already exists with the same email, link the social
   *     account to it.
   *   - Else create a brand-new user (no password) and link the account.
   */
  async socialLogin(dto: SocialLoginDto) {
    const profile =
      dto.provider === 'google' ? await this.verifyGoogleToken(dto.token) : await this.verifyFacebookToken(dto.token)

    if (!profile.providerUserId) {
      throw new UnauthorizedException('Could not verify social login token')
    }

    let social = await this.socialRepo.findOne({
      where: { provider: dto.provider, providerUserId: profile.providerUserId },
    })

    let user: User | null = null
    if (social) {
      user = await this.userRepo.findOne({ where: { id: social.userId } })
    } else if (profile.email) {
      user = await this.userRepo.findOne({ where: { email: profile.email } })
    }

    const activeStatus = await this.statusRepo.findOneByOrFail({ entityType: 'user', code: 'active' })

    if (!user) {
      user = this.userRepo.create({
        email: profile.email || null,
        displayName: profile.name || profile.email || `${dto.provider} user`,
        statusId: activeStatus.id,
        isVerified: 1,
      })
      await this.userRepo.save(user)
      await this.dataSync.mirror({
        entity: 'user',
        refId: user.id,
        payload: { id: user.id, email: user.email, displayName: user.displayName },
        userId: user.id,
      })
    }

    if (!social) {
      social = this.socialRepo.create({
        userId: user.id,
        provider: dto.provider,
        providerUserId: profile.providerUserId,
        statusId: activeStatus.id,
      })
      await this.socialRepo.save(social)
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated')
    }

    this.activityLog.log({
      action: 'auth.social_login',
      userId: user.id,
      meta: { provider: dto.provider },
    })
    return this.issueToken(user)
  }

  /** Verifies a Google ID token using the Google Identity Services public keys. */
  private async verifyGoogleToken(idToken: string): Promise<{ providerUserId: string; email?: string; name?: string }> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID')
    if (!clientId) {
      throw new BadRequestException('Google login is not configured (GOOGLE_CLIENT_ID missing)')
    }
    const client = new OAuth2Client(clientId)
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: clientId })
      const payload = ticket.getPayload()
      if (!payload) throw new Error('empty payload')
      return { providerUserId: payload.sub, email: payload.email, name: payload.name }
    } catch {
      throw new UnauthorizedException('Invalid Google token')
    }
  }

  /** Verifies a Facebook access token via the Graph API /me endpoint. */
  private async verifyFacebookToken(
    accessToken: string,
  ): Promise<{ providerUserId: string; email?: string; name?: string }> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`,
      )
      if (!res.ok) throw new Error(`Facebook API ${res.status}`)
      const data: any = await res.json()
      if (!data?.id) throw new Error('no id in response')
      return { providerUserId: data.id, email: data.email, name: data.name }
    } catch {
      throw new UnauthorizedException('Invalid Facebook token')
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('User not found')

    // Resolve the user's primary address (linked via entity_address) and
    // translate the state/district/city IDs into human-readable names.
    let address: {
      line1: string | null
      line2: string | null
      landmark: string | null
      state: string | null
      city: string | null
    } | null = null
    const link = await this.entityAddressRepo.findOne({
      where: { entityType: 'user', entityId: user.id, isPrimary: 1 },
    })
    if (link) {
      const addr = await this.addressRepo.findOne({ where: { id: link.addressId } })
      if (addr) {
        const [state, city] = await Promise.all([
          addr.stateId ? this.stateRepo.findOne({ where: { id: String(addr.stateId) } }) : null,
          addr.cityId ? this.cityRepo.findOne({ where: { id: String(addr.cityId) } }) : null,
        ])
        address = {
          line1: addr.line1,
          line2: addr.line2,
          landmark: addr.landmark,
          state: state?.name || null,
          city: city?.name || null,
        }
      }
    }

    return {
      id: user.id,
      name: user.displayName,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      freeListingsUsed: user.freeListingsUsed,
      freeContactsUsed: user.freeContactsUsed,
      memberSince: user.createdAt,
      address,
    }
  }

  // ============ LOGOUT ============
  /**
   * JWTs are stateless, so "logout" = blacklist the token in Redis
   * until its natural expiry. The JwtAuthGuard checks this blacklist.
   */
  async logout(token: string) {
    const decoded: any = this.jwt.decode(token)
    const nowSec = Math.floor(Date.now() / 1000)
    const ttl = decoded?.exp ? Math.max(decoded.exp - nowSec, 1) : 3600
    await this.redis.set(`blacklist:${token}`, '1', ttl)
    this.activityLog.log({ action: 'auth.logout', userId: decoded?.sub })
    return { message: 'Logged out successfully' }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.redis.exists(`blacklist:${token}`)
  }

  // ============ helpers ============
  // role override is only used for guest logins ('guest'); every other
  // caller relies on the user's real DB role (user | admin | super_admin)
  // so admins/super-admins get correct RBAC/dashboard routing on login.
  private issueToken(user: User, roleOverride?: 'guest') {
    const role = roleOverride || user.role || 'user'
    const payload = { sub: user.id, mobile: user.mobile, role }
    return {
      accessToken: this.jwt.sign(payload),
      tokenType: 'Bearer',
      role,
      user: {
        id: user.id,
        name: user.displayName,
        mobile: user.mobile,
        email: user.email,
        role,
      },
    }
  }
}
