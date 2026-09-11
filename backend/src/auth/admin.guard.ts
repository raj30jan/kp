import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

/**
 * Guards admin-only routes (e.g. product approval, complaint resolution).
 * Self-contained (does NOT need JwtAuthGuard chained first) — accepts either:
 *   - a Bearer JWT whose payload has role 'admin' or 'super_admin', OR
 *   - a static "x-admin-key" header matching ADMIN_API_KEY env var
 *     (bootstrap bridge for before any admin/super_admin account exists).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      try {
        const payload: any = this.jwt.verify(token)
        if (payload?.role === 'admin' || payload?.role === 'super_admin') {
          req.user = { userId: payload.sub, mobile: payload.mobile, role: payload.role }
          return true
        }
      } catch {
        // fall through to admin-key check
      }
    }

    const adminKey = this.config.get<string>('ADMIN_API_KEY')
    const headerKey = req.headers['x-admin-key']
    if (adminKey && headerKey && headerKey === adminKey) return true

    throw new UnauthorizedException('Admin access required')
  }
}
