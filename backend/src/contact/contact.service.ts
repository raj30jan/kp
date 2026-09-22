import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../auth/auth.service'
import { ComplaintsService } from '../complaints/complaints.service'
import { MailService } from '../common/mail.service'
import { ContactDto } from './dto/contact.dto'

/**
 * Public "Contact Us" enquiries.
 *
 * Flow: captcha check -> store as a complaint row (category 'other', subject
 * prefixed "Website enquiry") so it appears in the existing admin complaints
 * queue -> email the admin inbox (INFO_EMAIL) -> email the sender a thank-you.
 */
@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name)

  constructor(
    private readonly auth: AuthService,
    private readonly complaints: ComplaintsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async submit(dto: ContactDto) {
    // 1. Captcha — same Redis-backed math captcha used at registration.
    await this.auth.validateCaptcha(dto.captchaId, dto.captchaAnswer)

    // 2. Persist the enquiry so admin can see/track it in /admin/complaints.
    const saved = await this.complaints.create(
      {
        category: 'other',
        subject: `Website enquiry — ${dto.name}`,
        description: dto.message,
        contactMobile: dto.mobile,
        contactEmail: dto.email || null,
      } as any,
      undefined,
    )

    // 3. Notify the admin inbox (fire-and-forget — mail failures must not
    //    fail the enquiry itself).
    const adminTo = this.config.get<string>('INFO_EMAIL') || this.config.get<string>('FROM_EMAIL')
    if (adminTo) {
      this.mail
        .sendGenericEmail(
          adminTo,
          `New contact enquiry — ${dto.name}`,
          this.adminEmailHtml(dto),
          this.adminEmailText(dto),
        )
        .catch((e) => this.logger.warn(`admin enquiry email failed: ${e?.message}`))
    }

    // 4. Thank-you email to the sender (only when they gave an email).
    if (dto.email) {
      this.mail
        .sendGenericEmail(
          dto.email,
          'Thank you for contacting KisanPatrika',
          this.userEmailHtml(dto),
          this.userEmailText(dto),
        )
        .catch((e) => this.logger.warn(`user thank-you email failed: ${e?.message}`))
    }

    return { id: saved.id, message: 'Enquiry received. Our team will contact you shortly.' }
  }

  private adminEmailText(d: ContactDto) {
    return [
      `New enquiry from the KisanPatrika contact form:`,
      ``,
      `Name:    ${d.name}`,
      `Mobile:  ${d.mobile}`,
      `Email:   ${d.email || '—'}`,
      ``,
      `Message:`,
      d.message,
    ].join('\n')
  }

  private adminEmailHtml(d: ContactDto) {
    const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
    return `
      <div style="font-family:Arial,sans-serif;max-width:560px">
        <h2 style="color:#047857">New contact enquiry</h2>
        <table style="border-collapse:collapse;font-size:14px">
          <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td><b>${esc(d.name)}</b></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Mobile</td><td>${esc(d.mobile)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${esc(d.email || '—')}</td></tr>
        </table>
        <p style="margin-top:16px;color:#666;font-size:13px">Message:</p>
        <p style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:14px;white-space:pre-wrap">${esc(d.message)}</p>
      </div>`
  }

  private userEmailText(d: ContactDto) {
    return [
      `Namaste ${d.name},`,
      ``,
      `Thank you for contacting KisanPatrika. We have received your message and our team will get back to you within 24 hours.`,
      ``,
      `Your message:`,
      d.message,
      ``,
      `— Team KisanPatrika`,
    ].join('\n')
  }

  private userEmailHtml(d: ContactDto) {
    const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
    return `
      <div style="font-family:Arial,sans-serif;max-width:560px">
        <h2 style="color:#047857">Thank you for contacting KisanPatrika</h2>
        <p style="font-size:14px">Namaste <b>${esc(d.name)}</b>,</p>
        <p style="font-size:14px">We have received your message and our team will get back to you within 24 hours.</p>
        <p style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:14px;white-space:pre-wrap">${esc(d.message)}</p>
        <p style="font-size:13px;color:#666">— Team KisanPatrika</p>
      </div>`
  }
}
