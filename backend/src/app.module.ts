import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { envValidationSchema } from './config/env.validation'
import { MongoModule } from './mongo/mongo.module'
import { RedisModule } from './redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { ServiceInterestModule } from './service-interest/service-interest.module'

import { MarketplaceModule } from './marketplace/marketplace.module'
import { MembershipModule } from './membership/membership.module'
import { ComplaintsModule } from './complaints/complaints.module'
import { AdminUsersModule } from './admin-users/admin-users.module'
import { CategoriesModule } from './categories/categories.module'
import { AdminUiModule } from './admin-ui/admin-ui.module'

@Module({
  imports: [
    // Loads .env, validates it with Joi, makes ConfigService global
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // MySQL connection via TypeORM.
    // synchronize:false — we manage the schema ourselves with schema.sql
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('MYSQL_HOST'),
        port: config.get<number>('MYSQL_PORT'),
        username: config.get<string>('MYSQL_USER'),
        password: config.get<string>('MYSQL_PASSWORD'),
        database: config.get<string>('MYSQL_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    // MongoDB (activity logs, chat, AI sessions later).
    // Enabled/disabled via MONGO_ENABLED in .env
    MongoModule.register(),

    RedisModule,
    ServiceInterestModule,
    MarketplaceModule,
    MembershipModule,
    ComplaintsModule,
    AdminUsersModule,
    CategoriesModule,
    AdminUiModule,
    AuthModule,
  ],
})
export class AppModule {}

