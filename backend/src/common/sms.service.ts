import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * SMS fallback channel used by NotificationService when a user has no email
 * on file. No SMS gateway is wired up yet (same situation as OTP delivery —
 * see AuthService.sendOtp). Once an SMS provider (MSG91/Twilio) is
 * purchased, plug the HTTP call in here; everything else (NotificationService,
 * the `notifications` table, admin_notifications) already works end-to-end.
 *
 * TODO: integrate MSG91/Twilio using SMS_PROVIDER/SMS_API_KEY env vars.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name)

  constructor(private readonly config: ConfigService) {}

  async sendSms(mobile: string, message: string): Promise<boolean> {
    const apiKey = this.config.get<string>('SMS_API_KEY')
    if (!apiKey) {
      this.logger.warn(`SMS gateway not configured — SMS to ${mobile} skipped: "${message}"`)
      return false
    }
    // TODO: call the configured SMS provider's HTTP API here.
    this.logger.warn(`SMS gateway configured but not implemented — SMS to ${mobile} skipped`)
    return false
  }
}
