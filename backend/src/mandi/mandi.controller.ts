import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { MandiService } from './mandi.service'

@ApiTags('mandi')
@Controller('mandi')
export class MandiController {
  constructor(private readonly mandiService: MandiService) {}

  /**
   * Public proxy to data.gov.in AGMARKNET mandi prices.
   * Optional filters narrow results by state / district / market / commodity.
   */
  @Get('rates')
  @ApiOperation({ summary: 'Daily mandi (market) commodity prices from data.gov.in / AGMARKNET' })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'market', required: false })
  @ApiQuery({ name: 'commodity', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'Arrival date DD/MM/YYYY' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  getRates(
    @Query('state') state?: string,
    @Query('district') district?: string,
    @Query('market') market?: string,
    @Query('commodity') commodity?: string,
    @Query('date') date?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.mandiService.getRates({
      state,
      district,
      market,
      commodity,
      date,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    })
  }
}
