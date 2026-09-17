import { Body, Controller, Get, Param, Post, Query, Req, Res, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectDataSource } from '@nestjs/typeorm'
import { FileInterceptor } from '@nestjs/platform-express'
import { DataSource } from 'typeorm'
import { Response } from 'express'
import { ProductService } from '../../marketplace/product.service'
import { CategoryService } from '../../categories/category.service'
import { AdminErrorFilter } from '../admin-error.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { baseViewModel, parseIds, setFlash } from '../admin-ui.util'

@Controller('admin/products')
@UseFilters(AdminErrorFilter)
@UseGuards(AdminSessionGuard)
export class ProductsUiController {
  constructor(
    private readonly productService: ProductService,
    private readonly config: ConfigService,
    private readonly categoryService: CategoryService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private async categoriesForForm() {
    const [catRes, subRes] = await Promise.all([
      this.categoryService.list({ type: 'category', isActive: '1', limit: '1000' } as any),
      this.categoryService.list({ type: 'subcategory', isActive: '1', limit: '1000' } as any),
    ])
    const units = await this.dataSource
      .query('SELECT code, name FROM units WHERE deleted_at IS NULL ORDER BY name')
      .catch(() => [])
    return { categories: catRes.items, subcategories: subRes.items, units }
  }

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

  @Get('import/template')
  async downloadTemplate(@Res() res: Response) {
    const XLSX = require('xlsx')
    const data = [
      { title: 'Fresh Organic Tomatoes', category: 'vegetables', price: 25, priceUnit: 'per_kg', description: 'Farm fresh organic tomatoes', subCategory: 'tomato', quantity: 50, quantityUnit: 'kg', location: 'Village Rampur', state: 'Haryana', district: 'Fatehabad', mobile: '9876543210', email: 'seller@example.com', status: 'pending' },
      { title: 'Wheat Seeds (HD-2967)', category: 'seeds', price: 40, priceUnit: 'per_kg', description: 'High-yield wheat seeds', subCategory: 'wheat', quantity: 100, quantityUnit: 'kg', location: 'Farm House', state: 'Punjab', district: 'Ludhiana', mobile: '9876501234', email: '', status: 'active' },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="products-template.xlsx"')
    res.send(buf)
  }

  @Get('import')
  async importForm(@Req() req: any, @Res() res: Response) {
    res.render('products/import', {
      ...baseViewModel(req, res, 'Import Products', 'products'),
      result: null,
      error: null,
    })
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async importExcel(@UploadedFile() file: any, @Req() req: any, @Res() res: Response) {
    if (!file?.buffer) {
      return res.render('products/import', {
        ...baseViewModel(req, res, 'Import Products', 'products'),
        result: null,
        error: 'Please select an Excel file to upload',
      })
    }
    try {
      const result = await this.productService.importExcel(file.buffer)
      res.render('products/import', {
        ...baseViewModel(req, res, 'Import Products', 'products'),
        result,
        error: null,
      })
    } catch (e: any) {
      res.render('products/import', {
        ...baseViewModel(req, res, 'Import Products', 'products'),
        result: null,
        error: e?.message || 'Import failed',
      })
    }
  }

  @Get('new')
  async newForm(@Req() req: any, @Res() res: Response) {
    res.render('products/form', {
      ...baseViewModel(req, res, 'Add Product', 'products'),
      product: null,
      errors: null,
      ...(await this.categoriesForForm()),
    })
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
        ...(await this.categoriesForForm()),
      })
    }
  }

  @Get(':id/edit')
  async editForm(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const product = await this.productService.adminFindOne(id)
    res.render('products/form', {
      ...baseViewModel(req, res, 'Edit Product', 'products'),
      product,
      errors: null,
      ...(await this.categoriesForForm()),
    })
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
        ...(await this.categoriesForForm()),
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
    try {
      await this.productService.adminDelete(id)
      setFlash(res, this.config, 'Listing deleted')
    } catch (e: any) {
      setFlash(res, this.config, e?.message || 'Could not delete listing')
    }
    res.redirect('/admin/products')
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids)
    const result = await this.productService.bulkAction(ids, body.action)
    let msg = `${result.affected} listing(s) updated`
    if (result.errors?.length) {
      msg += `. Skipped: ${result.errors.join('; ')}`
    }
    setFlash(res, this.config, msg)
    res.redirect('/admin/products')
  }
}
