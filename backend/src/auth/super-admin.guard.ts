import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

/**
 * Guards super-admin-only routes (managing admins, buyers, sellers, paid
 * members). Self-contained — accepts either:
 *   - a Bearer JWT whose payload has role === 'super_admin', OR
 *   - a static "x-admin-key" header matching ADMIN_API_KEY env var
 *     (bootstrap bridge to promote the very first super_admin account).
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
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
        if (payload?.role === 'super_admin') {
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

    throw new UnauthorizedException('Super-admin access required')
  }
}
