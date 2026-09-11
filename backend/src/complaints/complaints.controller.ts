import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ComplaintsService } from './complaints.service'
import { CreateComplaintDto } from './dto/create-complaint.dto'
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

@ApiTags('Complaints')
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @ApiOperation({ summary: 'File a complaint (Legal / Terms / Policy / Fraud / Other)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() dto: CreateComplaintDto, @Request() req) {
    return this.complaintsService.create(dto, req.user?.userId)
  }

  @Get('my-complaints')
  @ApiOperation({ summary: 'List the logged-in user\'s own complaints' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async myComplaints(@Request() req) {
    return this.complaintsService.findByUser(req.user?.userId)
  }

  @Get()
  @ApiOperation({ summary: '[Admin] List all complaints, optionally filtered by status' })
  @UseGuards(AdminGuard)
  async findAll(@Query('status') status?: string) {
    return this.complaintsService.findAll(status)
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get complaint details' })
  @UseGuards(AdminGuard)
  async findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id)
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '[Admin] Update complaint status (resolve / reject / in_review)' })
  @UseGuards(AdminGuard)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateComplaintStatusDto, @Request() req) {
    return this.complaintsService.updateStatus(id, dto, req.user?.userId || 'admin')
  }
}
