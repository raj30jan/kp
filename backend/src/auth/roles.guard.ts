import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './roles.decorator'

/**
 * Must run AFTER JwtAuthGuard (so req.user is populated). Checks that
 * req.user.role is one of the roles listed in @Roles(...) on the route.
 * Usage: @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'super_admin')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const { user } = context.switchToHttp().getRequest()
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException(`Requires one of roles: ${required.join(', ')}`)
    }
    return true
  }
}
