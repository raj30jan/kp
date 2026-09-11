import { Body, Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { ProductService } from '../../marketplace/product.service'
import { AdminRedirectFilter } from '../admin-redirect.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { baseViewModel, parseIds, setFlash } from '../admin-ui.util'

@Controller('admin/products')
@UseFilters(AdminRedirectFilter)
@UseGuards(AdminSessionGuard)
export class ProductsUiController {
  constructor(
    private readonly productService: ProductService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async list(
    @Req() req: any,
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('q') q?: string,
    @Query('sort') sort = 'createdAt',
    @Query('dir') dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const data = await this.productService.adminList(status || undefined, Number(page) || 1, 20, q, sort, dir)
    res.render('products/list', {
      ...baseViewModel(req, res, 'Products', 'products'),
      data,
      statusFilter: status || '',
      q: q || '',
      sort,
      dir,
    })
  }

  @Get('new')
  newForm(@Req() req: any, @Res() res: Response) {
    res.render('products/form', { ...baseViewModel(req, res, 'Add Product', 'products'), product: null, errors: null })
  }

  @Post('new')
  async create(@Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      await this.productService.adminCreate({
        title: body.title,
        description: body.description || undefined,
        category: body.category,
        subCategory: body.subCategory || undefined,
        price: Number(body.price),
        priceUnit: body.priceUnit,
        quantity: body.quantity ? Number(body.quantity) : undefined,
        quantityUnit: body.quantityUnit || undefined,
        location: body.location || undefined,
        state: body.state || undefined,
        district: body.district || undefined,
        mobile: body.mobile || undefined,
        email: body.email || undefined,
        status: body.status || 'pending',
      } as any)
      setFlash(res, this.config, 'Listing created')
      res.redirect('/admin/products')
    } catch (e: any) {
      res.render('products/form', {
        ...baseViewModel(req, res, 'Add Product', 'products'),
        product: body,
        errors: e?.message || 'Could not create listing',
      })
    }
  }

  @Get(':id/edit')
  async editForm(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const product = await this.productService.adminFindOne(id)
    res.render('products/form', { ...baseViewModel(req, res, 'Edit Product', 'products'), product, errors: null })
  }

  @Post(':id/edit')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      await this.productService.adminUpdate(id, {
        title: body.title,
        description: body.description || undefined,
        category: body.category,
        subCategory: body.subCategory || undefined,
        price: Number(body.price),
        priceUnit: body.priceUnit,
        quantity: body.quantity ? Number(body.quantity) : undefined,
        quantityUnit: body.quantityUnit || undefined,
        location: body.location || undefined,
        state: body.state || undefined,
        district: body.district || undefined,
        mobile: body.mobile || undefined,
        email: body.email || undefined,
        status: body.status,
      } as any)
      setFlash(res, this.config, 'Listing updated')
      res.redirect('/admin/products')
    } catch (e: any) {
      res.render('products/form', {
        ...baseViewModel(req, res, 'Edit Product', 'products'),
        product: { id, ...body },
        errors: e?.message || 'Could not update listing',
      })
    }
  }

  @Post(':id/activate')
  async activateProduct(@Param('id') id: string, @Res() res: Response) {
    await this.productService.activate(id)
    setFlash(res, this.config, 'Listing approved and is now live')
    res.redirect('/admin/products')
  }

  @Post(':id/reject')
  async rejectProduct(@Param('id') id: string, @Res() res: Response) {
    await this.productService.reject(id)
    setFlash(res, this.config, 'Listing rejected')
    res.redirect('/admin/products')
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.productService.adminDelete(id)
    setFlash(res, this.config, 'Listing deleted')
    res.redirect('/admin/products')
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids)
    const result = await this.productService.bulkAction(ids, body.action)
    setFlash(res, this.config, `${result.affected} listing(s) updated`)
    res.redirect('/admin/products')
  }
}
