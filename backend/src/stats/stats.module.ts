import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StatsController } from './stats.controller'
import { StatsService } from './stats.service'
import { User } from '../users/entities/user.entity'
import { Product } from '../marketplace/entities/product.entity'
import { District } from '../location/entities/district.entity'
import { SiteVisit } from './entities/site-visit.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, Product, District, SiteVisit])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
