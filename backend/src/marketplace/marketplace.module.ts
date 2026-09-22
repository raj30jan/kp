import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Product } from './entities/product.entity'
import { ProductService } from './product.service'
import { ProductController } from './product.controller'
import { ProductExpiryCron } from './product-expiry.cron'
import { MongoModule } from '../mongo/mongo.module'
import { MembershipModule } from '../membership/membership.module'
import { ProductContact } from './entities/product-contact.entity'
import { MarketplaceProductHistory } from './entities/product-history.entity'
import { ProductReaction } from './entities/product-reaction.entity'
import { ProductInterest } from './entities/product-interest.entity'
import { NotificationModule } from '../notifications/notification.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductContact, MarketplaceProductHistory, ProductReaction, ProductInterest]),
    MongoModule,
    ScheduleModule.forRoot(),
    MembershipModule,
    NotificationModule,
  ],
  providers: [ProductService, ProductExpiryCron],
  controllers: [ProductController],
  exports: [ProductService],
})
export class MarketplaceModule {}
