import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnimalType } from './entities/animal-type.entity'
import { AnimalBreed } from './entities/animal-breed.entity'
import { AnimalListing } from './entities/animal-listing.entity'
import { AnimalListingImage } from './entities/animal-listing-image.entity'
import { AnimalService } from './animal.service'
import { AnimalController } from './animal.controller'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([AnimalType, AnimalBreed, AnimalListing, AnimalListingImage]),
    AuthModule,
  ],
  providers: [AnimalService],
  controllers: [AnimalController],
  exports: [AnimalService],
})
export class AnimalsModule {}
