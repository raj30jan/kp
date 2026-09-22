import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { BadRequestException } from '@nestjs/common'
import { QUANTITY_UNITS, PRICE_UNIT_CODES } from './units'
import { VIDEO_ALLOWED_MIME, VIDEO_UPLOAD_LIMIT_BYTES } from './product-video.util'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ProductService } from './product.service'
import { CreateProductDto } from './dto/create-product.dto'
import { ListProductsDto } from './dto/list-products.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ReactDto } from './dto/react.dto'
import { InterestDto } from './dto/interest.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

@ApiTags('Marketplace')
@Controller('marketplace')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('products')
  @ApiOperation({
    summary: 'Post a new product for sale (multipart/form-data: up to 5 images + 1 video clip)',
    description:
      'Common sell form for every commodity incl. agriculture land. `mobile` is mandatory. ' +
      'Video up to 300 MB is accepted and compressed server-side to <= 50 MB.',
  })
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
    @Body() dto: CreateProductDto,
    @Request() req,
    @UploadedFiles()
    files: { images?: Array<{ buffer: Buffer; originalname: string; size: number }>; video?: Array<{ buffer: Buffer; originalname: string; mimetype: string; size: number }> },
  ) {
    const images = files?.images || []
    const video = files?.video?.[0]
    if (images.some((f) => f.size > 8 * 1024 * 1024)) {
      throw new BadRequestException('Each image must be 8 MB or smaller')
    }
    const product = await this.productService.create(dto, req.user?.userId, images, video)
    return {
      id: product.id,
      status: product.status,
      videoUrl: product.videoUrl,
      message: 'Product submitted for admin approval',
    }
  }

  @Get('products/units')
  @ApiOperation({ summary: 'Quantity + price units accepted by the sell form (shared with the frontend)' })
  units() {
    return { quantityUnits: QUANTITY_UNITS, priceUnits: PRICE_UNIT_CODES }
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete your own product listing (removes images too)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Request() req) {
    return this.productService.remove(id, req.user?.userId)
  }

  @Post('products/:id/reactivate')
  @ApiOperation({ summary: 'Seller reactivates their own expired listing' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async reactivate(@Param('id') id: string, @Request() req) {
    return this.productService.reactivate(id, req.user?.userId)
  }

  @Get('admin/products/pending')
  @ApiOperation({ summary: '[Admin] List products awaiting approval' })
  @UseGuards(AdminGuard)
  async listPending() {
    return this.productService.listPending()
  }

  @Post('admin/products/:id/activate')
  @ApiOperation({ summary: '[Admin] Approve a listing so it appears live on the site' })
  @UseGuards(AdminGuard)
  async activate(@Param('id') id: string) {
    return this.productService.activate(id)
  }

  @Post('admin/products/:id/reject')
  @ApiOperation({ summary: '[Admin] Reject a pending listing' })
  @UseGuards(AdminGuard)
  async reject(@Param('id') id: string) {
    return this.productService.reject(id)
  }

  @Get('products')
  @ApiOperation({ summary: 'Browse products with optional filters' })
  async list(@Query() query: ListProductsDto) {
    return this.productService.list(query)
  }

  @Get('products/land/large-parcels')
  @ApiOperation({ summary: 'Highlighted large land parcels (Land/Property listings > minAcres, default 10 acres)' })
  async largeLandParcels(@Query('minAcres') minAcres?: string) {
    const min = minAcres ? parseFloat(minAcres) : 10
    return this.productService.findLargeLandParcels(Number.isFinite(min) ? min : 10)
  }

  @Get('products/categories')
  @ApiOperation({ summary: 'List available product categories' })
  async categories() {
    return { categories: await this.productService.findCategories() }
  }

  @Get('products/categories/tree')
  @ApiOperation({ summary: 'List active category tree for marketplace and sell forms' })
  async categoryTree() {
    return { tree: await this.productService.findActiveCategoryTree() }
  }

  @Get('products/locations')
  @ApiOperation({ summary: 'Distinct state -> districts across active listings (filter dropdowns)' })
  async locations() {
    return this.productService.findLocations()
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product details' })
  async detail(@Param('id') id: string) {
    return this.productService.findById(id)
  }

  @Get('my-products')
  @ApiOperation({ summary: 'List products posted by the logged-in seller (sale history, any status)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async myProducts(@Query() query: ListProductsDto, @Request() req) {
    return this.productService.list(query, req.user?.userId)
  }

  @Post('products/:id/contact')
  @ApiOperation({ summary: 'Reveal seller contact details for a product (counts toward buyer free-tier limit)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async contactSeller(@Param('id') id: string, @Request() req) {
    return this.productService.contactSeller(id, req.user?.userId)
  }

  @Patch('my-products/:id')
  @ApiOperation({ summary: 'Seller edits their own product from the dashboard (title cannot be changed)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMine(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req) {
    return this.productService.updateBySeller(id, req.user?.userId, dto)
  }

  @Get('my-products/:id/history')
  @ApiOperation({ summary: "Seller views their product's full edit history" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async myProductHistory(@Param('id') id: string, @Request() req) {
    return this.productService.getEditHistory(id, req.user?.userId)
  }

  @Get('my-products/:id/insights')
  @ApiOperation({ summary: 'Seller views engagement insights (views, contacts, likes/dislikes) for a product' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async myProductInsights(@Param('id') id: string, @Request() req) {
    return this.productService.getInsights(id, req.user?.userId)
  }

  @Get('interests')
  @ApiOperation({ summary: "List the caller's wishlist/cart items with product details (newest first)" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listInterests(@Query('type') type: 'wishlist' | 'cart' | undefined, @Request() req) {
    return this.productService.listInterests(req.user?.userId, type)
  }

  @Put('interests')
  @ApiOperation({ summary: 'Bookmark a product into the wishlist or cart bucket (idempotent)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async addInterest(@Body() dto: InterestDto, @Request() req) {
    return this.productService.addInterest(dto.productId, req.user?.userId, dto.type)
  }

  @Delete('interests')
  @ApiOperation({ summary: 'Remove a product from the wishlist or cart bucket' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async removeInterest(
    @Query('productId') productId: string,
    @Query('type') type: 'wishlist' | 'cart',
    @Request() req,
  ) {
    return this.productService.removeInterest(productId, req.user?.userId, type)
  }

  @Post('products/:id/react')
  @ApiOperation({ summary: 'Like or dislike a product (notifies the seller)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async react(@Param('id') id: string, @Body() dto: ReactDto, @Request() req) {
    return this.productService.react(id, req.user?.userId, dto.reaction)
  }

  @Get('my-purchases')
  @ApiOperation({ summary: "Buyer's lifetime purchase/interest history (contacted products)" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async myPurchases(@Request() req) {
    return this.productService.myPurchases(req.user?.userId)
  }
}
