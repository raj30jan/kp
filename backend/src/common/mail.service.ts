import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import { Transporter } from 'nodemailer'

/**
 * Sends transactional email via Brevo.
 *
 * Preferred: Brevo HTTP API (BREVO_API_KEY) — api-key auth over HTTPS,
 * no IP whitelisting, works from any network / dynamic IP.
 *
 * Fallback: SMTP relay (SMTP_HOST/PORT/USER/PASS) — note Brevo SMTP keys
 * can have IP restrictions, which break on dynamic IPs.
 *
 * If neither is configured, emails are skipped with a warning (dev-friendly).
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter | null = null
  private readonly apiKey: string | null = null
  private readonly from: string

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('BREVO_API_KEY') || null
    const host = this.config.get<string>('SMTP_HOST')
    const user = this.config.get<string>('SMTP_USER')
    const pass = this.config.get<string>('SMTP_PASS')
    this.from = this.config.get<string>('FROM_EMAIL') || user || 'no-reply@kisanpatrika.in'

    if (this.apiKey) {
      this.logger.log('MailService: using Brevo HTTP API')
    } else if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<number>('SMTP_PORT', 587) === 465,
        auth: { user, pass },
      })
      this.logger.log('MailService: using SMTP relay')
    } else {
      this.logger.warn('MailService: no email config — emails will be skipped')
    }
  }

  /** Send the OTP to the user's email. */
  async sendOtpEmail(to: string, otp: string, expiresInSeconds: number) {
    const minutes = Math.round(expiresInSeconds / 60)
    const subject = `Your KisanPatrika OTP: ${otp}`
    const text = `Your KisanPatrika verification code is ${otp}. It is valid for ${minutes} minutes. Do not share it with anyone.`
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#145214;margin:0 0 8px">KisanPatrika — किसान पत्रिका</h2>
        <p style="color:#374151">Your verification code (OTP) is:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#1e3a8a;margin:12px 0">${otp}</p>
        <p style="color:#6b7280;font-size:13px">Valid for ${minutes} minutes. Do not share this code with anyone.</p>
      </div>`

    if (this.apiKey) {
      return this.sendViaBrevoApi(to, subject, text, html)
    }
    if (this.transporter) {
      await this.transporter.sendMail({
        from: `KisanPatrika <${this.from}>`,
        to,
        subject,
        text,
        html,
      })
      this.logger.log(`OTP email sent to ${to} via SMTP`)
      return true
    }
    this.logger.warn(`Email not configured — OTP email to ${to} skipped`)
    return false
  }

  /** Generic transactional email (used by NotificationService for engagement/feedback emails). */
  async sendGenericEmail(to: string, subject: string, html: string, text?: string) {
    const plain = text || html.replace(/<[^>]+>/g, ' ')
    if (this.apiKey) {
      return this.sendViaBrevoApi(to, subject, plain, html)
    }
    if (this.transporter) {
      await this.transporter.sendMail({
        from: `KisanPatrika <${this.from}>`,
        to,
        subject,
        text: plain,
        html,
      })
      this.logger.log(`Email sent to ${to} via SMTP`)
      return true
    }
    this.logger.warn(`Email not configured — email to ${to} skipped`)
    return false
  }

  /** Brevo transactional email API — POST /v3/smtp/email with api-key header. */
  private async sendViaBrevoApi(to: string, subject: string, text: string, html: string) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.apiKey!,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'KisanPatrika', email: this.from },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      this.logger.error(`Brevo API ${res.status}: ${body}`)
      throw new Error(`Brevo API error ${res.status}`)
    }
    this.logger.log(`OTP email sent to ${to} via Brevo API`)
    return true
  }
}
