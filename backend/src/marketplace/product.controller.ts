import { Body, Controller, Delete, Get, Param, Post, Query, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ProductService } from './product.service'
import { CreateProductDto } from './dto/create-product.dto'
import { ListProductsDto } from './dto/list-products.dto'
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

  @Get('products/categories')
  @ApiOperation({ summary: 'List available product categories' })
  async categories() {
    return { categories: await this.productService.findCategories() }
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

  @Get('my-purchases')
  @ApiOperation({ summary: "Buyer's lifetime purchase/interest history (contacted products)" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async myPurchases(@Request() req) {
    return this.productService.myPurchases(req.user?.userId)
  }
}
