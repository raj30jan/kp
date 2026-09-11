import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

/**
 * Validates the "Authorization: Bearer <token>" header on protected routes.
 * The decoded payload is attached to request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    })
  }

  async validate(payload: { sub: string; mobile: string; role: string }) {
    return { userId: payload.sub, mobile: payload.mobile, role: payload.role }
  }
}
