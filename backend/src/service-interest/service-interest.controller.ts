import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { JwtService } from '@nestjs/jwt'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateServiceInterestDto, UpdateContactStatusDto } from './dto/service-interest.dto'
import { ServiceInterestService } from './service-interest.service'

@ApiTags('Service Interest')
@Controller('service-interest')
export class ServiceInterestController {
  constructor(
    private readonly service: ServiceInterestService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Public endpoint — records a service selection from the home page.
   * If the visitor is logged in (Bearer token), the user_id is attached
   * automatically so the support team knows who to call.
   */
  @Post()
  @ApiOperation({ summary: 'Record a service selection (public — guests allowed)' })
  record(
    @Body() dto: CreateServiceInterestDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Headers('authorization') auth?: string,
  ) {
    const userId = this.extractUserId(auth)
    return this.service.record(dto, { userId, ip, userAgent })
  }

  /** Support team endpoints — JWT required. */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List service interests for the support/calling team' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONTACTED', 'GUIDED', 'CLOSED'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
  ) {
    return this.service.list(status, limit)
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update contact status (support team)' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactStatusDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.updateStatus(id, dto, this.extractUserId(auth))
  }

  /** Decode Bearer token if present; returns null for guests/invalid tokens. */
  private extractUserId(auth?: string): string | undefined {
    if (!auth?.startsWith('Bearer ')) return undefined
    try {
      const payload: any = this.jwt.decode(auth.slice(7))
      return payload?.sub || payload?.userId || undefined
    } catch {
      return undefined
    }
  }
}
