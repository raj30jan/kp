import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Complaint } from './entities/complaint.entity'
import { ComplaintsService } from './complaints.service'
import { ComplaintsController } from './complaints.controller'
import { MongoModule } from '../mongo/mongo.module'

@Module({
  imports: [TypeOrmModule.forFeature([Complaint]), MongoModule],
  providers: [ComplaintsService],
  controllers: [ComplaintsController],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
