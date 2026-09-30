import { Body, Controller, Delete, Get, Param, Post, Query, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { BadRequestException } from '@nestjs/common'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AnimalService } from './animal.service'
import { CreateAnimalDto } from './dto/create-animal.dto'
import { ListAnimalsDto } from './dto/list-animals.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { VIDEO_ALLOWED_MIME, VIDEO_UPLOAD_LIMIT_BYTES } from '../marketplace/product-video.util'

@ApiTags('Animals')
@Controller('animals')
export class AnimalController {
  constructor(private readonly animalService: AnimalService) {}

  @Get('types')
  @ApiOperation({ summary: 'Animal types with their breeds — feeds the type→breed dropdowns' })
  types() {
    return this.animalService.getTypes()
  }

  @Get('breeds')
  @ApiOperation({ summary: 'Breeds for a given animal type' })
  breeds(@Query('animalTypeId') animalTypeId: string) {
    return this.animalService.getBreeds(Number(animalTypeId))
  }

  @Get('listings')
  @ApiOperation({ summary: 'Public list of approved animals for sale' })
  list(@Query() query: ListAnimalsDto) {
    return this.animalService.list(query)
  }

  @Get('listings/mine')
  @ApiOperation({ summary: "Seller's own animal listings" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myListings(@Request() req: any) {
    return this.animalService.myListings(req.user?.userId)
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Single animal listing detail' })
  findOne(@Param('id') id: string) {
    return this.animalService.findOne(id)
  }

  @Post('listings')
  @ApiOperation({ summary: 'Post an animal for sale (multipart: up to 5 images + 1 video)' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 5 },
        { name: 'video', maxCount: 1 },
      ],
      {
        limits: { fileSize: VIDEO_UPLOAD_LIMIT_BYTES },
        fileFilter: (_req, file, cb) => {
          if (file.fieldname === 'video' && !VIDEO_ALLOWED_MIME.includes(file.mimetype)) {
            return cb(new BadRequestException('Unsupported video format — upload MP4, MOV, WEBM, MKV or 3GP'), false)
          }
          if (file.fieldname === 'images' && !file.mimetype.startsWith('image/')) {
            return cb(new BadRequestException('Only image files are allowed in images'), false)
          }
          cb(null, true)
        },
      },
    ),
  )
  async create(
    @Body() dto: CreateAnimalDto,
    @Request() req: any,
    @UploadedFiles()
    files: { images?: Array<{ buffer: Buffer; originalname: string; size: number }>; video?: Array<{ buffer: Buffer; originalname: string; mimetype: string; size: number }> },
  ) {
    const images = files?.images || []
    const video = files?.video?.[0]
    if (images.some((f) => f.size > 8 * 1024 * 1024)) {
      throw new BadRequestException('Each image must be 8 MB or smaller')
    }
    const listing = await this.animalService.create(dto, req.user?.userId, images, video)
    return { id: listing.id, status: listing.status, message: 'Animal submitted for approval' }
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Delete your own animal listing' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Request() req: any) {
    return this.animalService.remove(id, req.user?.userId)
  }
}
