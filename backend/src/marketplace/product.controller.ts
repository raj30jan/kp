import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ProductService } from './product.service'
import { CreateProductDto } from './dto/create-product.dto'
import { ListProductsDto } from './dto/list-products.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ReactDto } from './dto/react.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

@ApiTags('Marketplace')
@Controller('marketplace')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('products')
  @ApiOperation({ summary: 'Post a new product for sale (multipart/form-data, up to 5 images)' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('images', 5, { limits: { fileSize: 8 * 1024 * 1024 } }))
  async create(
    @Body() dto: CreateProductDto,
    @Request() req,
    @UploadedFiles() files: Array<{ buffer: Buffer; originalname: string }>,
  ) {
    const product = await this.productService.create(dto, req.user?.userId, files)
    return { id: product.id, status: product.status, message: 'Product submitted for admin approval' }
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
