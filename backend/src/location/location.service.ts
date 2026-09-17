import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Country } from './entities/country.entity'
import { State } from './entities/state.entity'
import { District } from './entities/district.entity'
import { City } from './entities/city.entity'

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
    @InjectRepository(State) private readonly stateRepo: Repository<State>,
    @InjectRepository(District) private readonly districtRepo: Repository<District>,
    @InjectRepository(City) private readonly cityRepo: Repository<City>,
  ) {}

  getCountries() {
    return this.countryRepo.find({ order: { name: 'ASC' } })
  }

  getStates(countryId: string) {
    return this.stateRepo.find({ where: { countryId }, order: { name: 'ASC' } })
  }

  getDistricts(stateId: string) {
    return this.districtRepo.find({ where: { stateId }, order: { name: 'ASC' } })
  }

  getCities(districtId: string) {
    return this.cityRepo.find({ where: { districtId }, order: { name: 'ASC' } })
  }
}
