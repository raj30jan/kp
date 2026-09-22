import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import { SiteSetting } from './site-setting.entity'

export const MEMBERSHIP_SETTING_KEYS = [
  'membership_qr_url',
  'membership_upi_id',
  'membership_payee_name',
  'membership_payment_note',
] as const

const SETTINGS_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'settings')

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSetting)
    private readonly repo: Repository<SiteSetting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } })
    return row?.value ?? null
  }

  async getMany(keys: readonly string[]): Promise<Record<string, string | null>> {
    const rows = await this.repo.find()
    const out: Record<string, string | null> = {}
    for (const k of keys) out[k] = rows.find((r) => r.key === k)?.value ?? null
    return out
  }

  async set(key: string, value: string | null, updatedBy?: string) {
    const row = this.repo.create({ key, value, updatedBy: updatedBy || null })
    await this.repo.save(row)
    return row
  }

  /** Public, safe-to-expose payment instructions for the membership page. */
  async getMembershipPaymentInfo() {
    const s = await this.getMany(MEMBERSHIP_SETTING_KEYS)
    return {
      qrUrl: s.membership_qr_url,
      upiId: s.membership_upi_id,
      payeeName: s.membership_payee_name,
      note: s.membership_payment_note,
      configured: Boolean(s.membership_qr_url || s.membership_upi_id),
    }
  }

  /**
   * Super-admin uploads the payment QR image. Normalised to a 800px PNG so
   * whatever the admin uploads (JPG screenshot, huge PNG) renders crisply
   * and small on the membership page.
   */
  async saveMembershipQr(file: { buffer: Buffer; mimetype: string }, updatedBy?: string) {
    if (!file?.buffer) throw new BadRequestException('QR image file is required')
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('QR code must be an image (PNG/JPG)')
    fs.mkdirSync(SETTINGS_UPLOAD_DIR, { recursive: true })
    const filename = `membership-qr-${Date.now()}.png`
    const dest = path.join(SETTINGS_UPLOAD_DIR, filename)
    await sharp(file.buffer).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).png().toFile(dest)

    // Remove the previous QR so old files don't accumulate.
    const old = await this.get('membership_qr_url')
    if (old) {
      const oldPath = path.join(process.cwd(), old.replace(/^\//, ''))
      if (oldPath.startsWith(SETTINGS_UPLOAD_DIR) && fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath) } catch {}
      }
    }
    const url = `/uploads/settings/${filename}`
    await this.set('membership_qr_url', url, updatedBy)
    return url
  }

  async removeMembershipQr(updatedBy?: string) {
    const old = await this.get('membership_qr_url')
    if (old) {
      const oldPath = path.join(process.cwd(), old.replace(/^\//, ''))
      if (oldPath.startsWith(SETTINGS_UPLOAD_DIR) && fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath) } catch {}
      }
    }
    await this.set('membership_qr_url', null, updatedBy)
  }
}
