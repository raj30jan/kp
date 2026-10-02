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
import { CreateExportInquiryDto, UpdateExportInquiryStatusDto } from './dto/export-inquiry.dto'
import { ExportInquiryService } from './export-inquiry.service'

@ApiTags('Export Import')
@Controller('export-inquiries')
export class ExportInquiryController {
  constructor(
    private readonly service: ExportInquiryService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Public endpoint — records an export/import enquiry from /export-import.
   * If the visitor is logged in (Bearer token), the user_id is attached
   * automatically so the support team knows who to call.
   */
  @Post()
  @ApiOperation({ summary: 'Record an export/import inquiry (public — guests allowed)' })
  record(
    @Body() dto: CreateExportInquiryDto,
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
  @ApiOperation({ summary: 'List export/import inquiries for the support team' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONTACTED', 'GUIDED', 'CLOSED'] })
  @ApiQuery({ name: 'direction', required: false, enum: ['EXPORT', 'IMPORT'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @Query('status') status?: string,
    @Query('direction') direction?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
  ) {
    return this.service.list(status, direction, limit)
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update inquiry contact status (support team)' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExportInquiryStatusDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.service.updateStatus(id, dto, this.extractUserId(auth))
  }

  /** Decode Bearer token if present; returns undefined for guests/invalid tokens. */
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
