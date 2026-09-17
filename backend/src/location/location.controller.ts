import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { LocationService } from './location.service'

@ApiTags('Location')
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List all countries' })
  getCountries() {
    return this.locationService.getCountries()
  }

  @Get('states')
  @ApiOperation({ summary: 'List states for a country' })
  getStates(@Query('countryId') countryId: string) {
    return this.locationService.getStates(countryId)
  }

  @Get('districts')
  @ApiOperation({ summary: 'List districts for a state' })
  getDistricts(@Query('stateId') stateId: string) {
    return this.locationService.getDistricts(stateId)
  }

  @Get('cities')
  @ApiOperation({ summary: 'List cities for a district' })
  getCities(@Query('districtId') districtId: string) {
    return this.locationService.getCities(districtId)
  }
}
