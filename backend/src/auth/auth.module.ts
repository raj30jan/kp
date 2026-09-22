import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MailService } from '../common/mail.service'
import { StatusMaster } from '../common/entities/status-master.entity'
import { Address } from '../users/entities/address.entity'
import { EntityAddress } from '../users/entities/entity-address.entity'
import { User } from '../users/entities/user.entity'
import { UserSocialAccount } from '../users/entities/user-social-account.entity'
import { State } from '../location/entities/state.entity'
import { District } from '../location/entities/district.entity'
import { City } from '../location/entities/city.entity'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { JwtStrategy } from './jwt.strategy'
import { AdminGuard } from './admin.guard'
import { SuperAdminGuard } from './super-admin.guard'
import { RolesGuard } from './roles.guard'

// @Global() so AdminGuard / SuperAdminGuard / RolesGuard / JwtModule are
// available to every feature module (marketplace, membership, complaints,
// admin-users) without re-importing JWT config everywhere.
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address, EntityAddress, StatusMaster, UserSocialAccount, State, District, City]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '1d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, MailService, AdminGuard, SuperAdminGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, AdminGuard, SuperAdminGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
