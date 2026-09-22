import { Controller, Get } from '@nestjs/common'
import { StatsService } from './stats.service'

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /** Public landing-page counters — no auth needed. */
  @Get('public')
  publicStats() {
    return this.statsService.publicStats()
  }
}
