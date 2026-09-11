import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AdminRedirectException } from './admin-redirect.exception'

/**
 * Session guard for the server-rendered Backend Admin UI (/admin/*).
 * Reads the httpOnly "admin_token" cookie (set on successful /admin/login),
 * verifies it, and requires role 'admin' or 'super_admin'. On failure it
 * throws AdminRedirectException so the user is bounced to /admin/login
 * with a friendly message, instead of a raw 401/403 JSON error.
 */
@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const token = req.cookies?.admin_token

    if (!token) {
      throw new AdminRedirectException('/admin/login', 'Please log in to continue')
    }
    try {
      const payload: any = this.jwt.verify(token)
      if (payload?.role !== 'admin' && payload?.role !== 'super_admin') {
        throw new Error('not admin')
      }
      req.adminUser = { id: payload.sub, mobile: payload.mobile, name: payload.name, role: payload.role }
      return true
    } catch {
      throw new AdminRedirectException('/admin/login', 'Session expired — please log in again')
    }
  }
}
