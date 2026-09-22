import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ServiceService } from './service.service'
import { CreateServiceDto, ListServicesDto, RATE_UNITS, SERVICE_TYPES, UpdateServiceDto } from './dto/service.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

@ApiTags('Services')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @ApiOperation({
    summary: 'Offer a service (hire labour, machinery, vet, patwari, loan agent, transport) — goes live only after admin approval',
    description: 'multipart/form-data: fields + up to 5 images (photos, certificates, vehicle pics).',
  })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 5 }], {
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false)
        }
        cb(null, true)
      },
    }),
  )
  async create(
    @Body() dto: CreateServiceDto,
    @Request() req: any,
    @UploadedFiles() files: { images?: Array<{ buffer: Buffer; originalname: string; size: number }> },
  ) {
    const svc = await this.serviceService.create(dto, req.user?.userId, files?.images || [])
    return { id: svc.id, status: svc.status, message: 'Service submitted for admin approval' }
  }

  @Get('types')
  @ApiOperation({ summary: 'Service types + rate units accepted by the offer form' })
  types() {
    return { serviceTypes: SERVICE_TYPES, rateUnits: RATE_UNITS }
  }

  @Get('mine')
  @ApiOperation({ summary: 'List services offered by the logged-in provider (any status)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async mine(@Query() query: ListServicesDto, @Request() req: any) {
    return this.serviceService.list(query, req.user?.userId)
  }

  @Patch('mine/:id')
  @ApiOperation({ summary: 'Provider edits their own listing — returns to pending for admin re-approval' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMine(@Param('id') id: string, @Body() dto: UpdateServiceDto, @Request() req: any) {
    return this.serviceService.updateBySeller(id, req.user?.userId, dto)
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Provider reactivates their expired listing — returns to pending for admin re-approval' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async reactivate(@Param('id') id: string, @Request() req: any) {
    return this.serviceService.reactivate(id, req.user?.userId)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete your own service listing (removes images too)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.serviceService.remove(id, req.user?.userId)
  }

  // ---------- Admin (JWT AdminGuard — same as marketplace admin endpoints) ----------

  @Get('admin/pending')
  @ApiOperation({ summary: '[Admin] List service listings awaiting approval' })
  @UseGuards(AdminGuard)
  async listPending() {
    return this.serviceService.listPending()
  }

  @Post('admin/:id/activate')
  @ApiOperation({ summary: '[Admin] Approve a service listing so it appears live' })
  @UseGuards(AdminGuard)
  async activate(@Param('id') id: string) {
    return this.serviceService.activate(id)
  }

  @Post('admin/:id/reject')
  @ApiOperation({ summary: '[Admin] Reject a pending service listing' })
  @UseGuards(AdminGuard)
  async reject(@Param('id') id: string) {
    return this.serviceService.reject(id)
  }

  // ---------- Public browse ----------

  @Get()
  @ApiOperation({ summary: 'Browse active service listings with optional filters (type, state, district, q)' })
  async list(@Query() query: ListServicesDto) {
    return this.serviceService.list(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service listing details (increments view count)' })
  async detail(@Param('id') id: string) {
    return this.serviceService.findById(id)
  }
}
