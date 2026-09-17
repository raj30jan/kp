import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Country } from './entities/country.entity'
import { State } from './entities/state.entity'
import { District } from './entities/district.entity'
import { City } from './entities/city.entity'
import { LocationService } from './location.service'
import { LocationController } from './location.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Country, State, District, City])],
  providers: [LocationService],
  controllers: [LocationController],
  exports: [LocationService],
})
export class LocationModule {}
