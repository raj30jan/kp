import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ServiceProvider } from './entities/service-provider.entity'
import { ServiceService } from './service.service'
import { ServiceController } from './service.controller'
import { MongoModule } from '../mongo/mongo.module'

@Module({
  imports: [TypeOrmModule.forFeature([ServiceProvider]), MongoModule],
  providers: [ServiceService],
  controllers: [ServiceController],
  exports: [ServiceService],
})
export class ServiceModule {}
