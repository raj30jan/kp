import { Body, Controller, Get, Ip, Post, Req } from '@nestjs/common'
import { Request } from 'express'
import { StatsService } from './stats.service'

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /** Public landing-page counters — no auth needed. */
  @Get('public')
  publicStats() {
    return this.statsService.publicStats()
  }

  /** Footer visitor counter — one row per browser session, deduped server-side. */
  @Post('visit')
  recordVisit(@Body() body: { sessionId?: string }, @Ip() ip: string, @Req() req: Request) {
    return this.statsService.recordVisit(body?.sessionId || '', {
      ip,
      userAgent: req.headers['user-agent'],
    })
  }
}
