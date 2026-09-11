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
import { Repository } from 'typeorm'
import { StatusMaster } from '../common/entities/status-master.entity'
import { MailService } from '../common/mail.service'
import { ActivityLogService } from '../mongo/activity-log.service'
import { DataSyncService } from '../mongo/data-sync.service'
import { RedisService } from '../redis/redis.service'
import { Address } from '../users/entities/address.entity'
import { EntityAddress } from '../users/entities/entity-address.entity'
import { User } from '../users/entities/user.entity'
import { GuestLoginDto } from './dto/guest-login.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { SendOtpDto } from './dto/send-otp.dto'
import { VerifyOtpDto } from './dto/verify-otp.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Address) private readonly addressRepo: Repository<Address>,
    @InjectRepository(EntityAddress) private readonly entityAddressRepo: Repository<EntityAddress>,
    @InjectRepository(StatusMaster) private readonly statusRepo: Repository<StatusMaster>,
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

  private async validateCaptcha(captchaId: string, answer: string) {
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

    // 1. Captcha must be valid (only when OTP flow is on)
    if (otpRequired) {
      await this.validateCaptcha(dto.captchaId!, dto.captchaAnswer!)
    }

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
   * Email (or mobile) + password login. No OTP required while OTP_REQUIRED
   * is off — re-enable OTP verification at production go-live.
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
    this.activityLog.log({ action: 'auth.login', userId: user.id, mobile: user.mobile || undefined })
    return this.issueToken(user)
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

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('User not found')
    return {
      id: user.id,
      name: user.displayName,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      freeListingsUsed: user.freeListingsUsed,
      freeContactsUsed: user.freeContactsUsed,
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
