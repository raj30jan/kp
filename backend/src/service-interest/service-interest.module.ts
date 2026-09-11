import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ServiceInterest } from './entities/service-interest.entity'
import { ServiceInterestController } from './service-interest.controller'
import { ServiceInterestService } from './service-interest.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceInterest]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [ServiceInterestController],
  providers: [ServiceInterestService],
  exports: [ServiceInterestService],
})
export class ServiceInterestModule {}
