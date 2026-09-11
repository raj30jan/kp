import { ConfigService } from '@nestjs/config'
import { Request, Response } from 'express'

/** Reads + clears the one-shot flash cookie set by AdminRedirectFilter / action handlers. */
export function popFlash(req: Request, res: Response): string | null {
  const flash = req.cookies?.admin_flash
  if (flash) res.clearCookie('admin_flash')
  return flash || null
}

export function setFlash(res: Response, config: ConfigService, message: string) {
  res.cookie('admin_flash', message, cookieOpts(config, 5000))
}

export function cookieOpts(config: ConfigService, maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: config.get('NODE_ENV') === 'production',
    maxAge: maxAgeMs,
  }
}

/** Parses `ids` from a bulk-action form (checkbox array) into a clean string[]. */
export function parseIds(raw: unknown): string[] {
  if (!raw) return []
  return Array.isArray(raw) ? raw.map(String) : [String(raw)]
}

/** Common view-model fields every authenticated admin page needs. */
export function baseViewModel(req: any, res: Response, title: string, active: string) {
  return {
    title,
    active,
    adminUser: req.adminUser,
    adminName: req.cookies?.admin_name || 'Admin',
    flash: popFlash(req, res),
  }
}
