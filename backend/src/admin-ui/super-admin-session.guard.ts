import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AdminRedirectException } from './admin-redirect.exception'

/**
 * Like AdminSessionGuard, but requires role === 'super_admin' specifically
 * (e.g. promoting/demoting admins). Redirects to the dashboard with a
 * flash message if a plain admin tries to access these pages.
 */
@Injectable()
export class SuperAdminSessionGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const token = req.cookies?.admin_token

    if (!token) {
      throw new AdminRedirectException('/admin/login', 'Please log in to continue')
    }
    try {
      const payload: any = this.jwt.verify(token)
      if (payload?.role !== 'super_admin') {
        throw new AdminRedirectException('/admin', 'Super-admin access required')
      }
      req.adminUser = { id: payload.sub, mobile: payload.mobile, name: payload.name, role: payload.role }
      return true
    } catch (e) {
      if (e instanceof AdminRedirectException) throw e
      throw new AdminRedirectException('/admin/login', 'Session expired — please log in again')
    }
  }
}
