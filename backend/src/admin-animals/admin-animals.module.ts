import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnimalListing } from '../animals/entities/animal-listing.entity'
import { AnimalType } from '../animals/entities/animal-type.entity'
import { AdminAnimalsService } from './admin-animals.service'
import { AdminAnimalsController } from './admin-animals.controller'

@Module({
  imports: [TypeOrmModule.forFeature([AnimalListing, AnimalType])],
  providers: [AdminAnimalsService],
  controllers: [AdminAnimalsController],
  exports: [AdminAnimalsService],
})
export class AdminAnimalsModule {}
