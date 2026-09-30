import { Controller, Get, Query } from '@nestjs/common'
import { WeatherService } from './weather.service'

@Controller('weather')
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  /** GET /weather/cities — supported cities for the selector. */
  @Get('cities')
  cities() {
    return { cities: this.weather.cityList() }
  }

  /** GET /weather?city=Delhi — current conditions + 7-day forecast + advisory. */
  @Get()
  forecast(@Query('city') city?: string) {
    return this.weather.forCity(city)
  }
}
