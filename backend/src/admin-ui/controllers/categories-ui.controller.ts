import { Body, Controller, Get, Param, Post, Query, Req, Res, UploadedFile, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import { CategoryService } from '../../categories/category.service'
import { AdminErrorFilter } from '../admin-error.filter'
import { AdminSessionGuard } from '../admin-session.guard'
import { baseViewModel, parseIds, setFlash } from '../admin-ui.util'

/**
 * Admin UI for the Category module — N-level hierarchical categories
 * for products and services. Full CRUD, search, sort, pagination,
 * activate/deactivate, and bulk actions.
 */
@Controller('admin/categories')
@UseFilters(AdminErrorFilter)
@UseGuards(AdminSessionGuard)
export class CategoriesUiController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly config: ConfigService,
  ) {}

  private saveIconImage(file: any): string | null {
    if (!file?.buffer) return null
    const uploadsDir = path.join(process.cwd(), 'uploads', 'categories')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
    const ext = path.extname(file.originalname) || '.png'
    const filename = `icon-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    fs.writeFileSync(path.join(uploadsDir, filename), file.buffer)
    return `/uploads/categories/${filename}`
  }

  @Get()
  async list(
    @Req() req: any,
    @Res() res: Response,
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('parentId') parentId?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page = '1',
    @Query('sort') sort = 'displayOrder',
    @Query('dir') dir: 'ASC' | 'DESC' = 'ASC',
    @Query('view') view = 'list',
  ) {
    if (view === 'tree') {
      const tree = await this.categoryService.treeFlat(type, q)
      res.render('categories/list-tree', {
        ...baseViewModel(req, res, 'Categories', 'categories'),
        tree,
        typeFilter: type || '',
        q: q || '',
        isActiveFilter: isActive || '',
      })
      return
    }
    const data = await this.categoryService.adminList(q, type, parentId, isActive, Number(page) || 1, 20, sort, dir)
    res.render('categories/list', {
      ...baseViewModel(req, res, 'Categories', 'categories'),
      data,
      typeFilter: type || '',
      q: q || '',
      parentIdFilter: parentId || '',
      isActiveFilter: isActive || '',
      sort,
      dir,
      view,
    })
  }

  @Get('import/template')
  async downloadTemplate(@Res() res: Response) {
    const XLSX = require('xlsx')
    const data = [
      { name: 'Seeds', slug: 'seeds', type: 'category', parentSlug: '', displayOrder: 1, iconUrl: 'https://cdn-icons-png.flaticon.com/128/2675/2675666.png', description: 'All types of seeds' },
      { name: 'Vegetables', slug: 'vegetables', type: 'category', parentSlug: '', displayOrder: 2, iconUrl: 'https://cdn-icons-png.flaticon.com/128/2917/2917994.png', description: 'Fresh vegetables' },
      { name: 'Tomatoes', slug: 'tomatoes', type: 'subcategory', parentSlug: 'vegetables', displayOrder: 1, iconUrl: '', description: '' },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Categories')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="categories-template.xlsx"')
    res.send(buf)
  }

  @Get('import')
  async importForm(@Req() req: any, @Res() res: Response) {
    res.render('categories/import', {
      ...baseViewModel(req, res, 'Import Categories', 'categories'),
      result: null,
      error: null,
    })
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async importExcel(@UploadedFile() file: any, @Req() req: any, @Res() res: Response) {
    // Increase timeout for large imports (up to 2 hours for AI image generation)
    req.setTimeout?.(7200000)
    res.setTimeout?.(7200000)
    if (!file?.buffer) {
      return res.render('categories/import', {
        ...baseViewModel(req, res, 'Import Categories', 'categories'),
        result: null,
        error: 'Please select an Excel file to upload',
      })
    }
    try {
      const generateImages = req.body?.generateImages === 'on' || req.body?.generateImages === 'true'
      const result = await this.categoryService.importExcel(file.buffer, req.adminUser?.id, generateImages)
      res.render('categories/import', {
        ...baseViewModel(req, res, 'Import Categories', 'categories'),
        result,
        error: null,
      })
    } catch (e: any) {
      res.render('categories/import', {
        ...baseViewModel(req, res, 'Import Categories', 'categories'),
        result: null,
        error: e?.message || 'Import failed',
      })
    }
  }

  @Get('new')
  async newForm(@Req() req: any, @Res() res: Response, @Query('parentId') parentId?: string, @Query('type') type?: string) {
    const categories = await this.categoryService.forDropdown(undefined, type)
    res.render('categories/form', {
      ...baseViewModel(req, res, 'Add Category', 'categories'),
      category: null,
      categories,
      preselectedParentId: parentId || '',
      preselectedType: type || 'category',
      errors: null,
    })
  }

  @Post('new')
  @UseInterceptors(FileInterceptor('iconImage', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async create(@UploadedFile() iconFile: any, @Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      const iconPath = this.saveIconImage(iconFile)
      await this.categoryService.create(
        {
          name: body.name,
          slug: body.slug || undefined,
          parentId: body.parentId || null,
          type: body.type || 'category',
          displayOrder: body.displayOrder ? Number(body.displayOrder) : 0,
          icon: iconPath || body.icon || undefined,
          description: body.description || undefined,
        },
        req.adminUser.id,
      )
      setFlash(res, this.config, 'Category created')
      res.redirect('/admin/categories')
    } catch (e: any) {
      const categories = await this.categoryService.forDropdown(undefined, body.type)
      res.render('categories/form', {
        ...baseViewModel(req, res, 'Add Category', 'categories'),
        category: body,
        categories,
        preselectedParentId: body.parentId || '',
        preselectedType: body.type || 'category',
        errors: e?.message || 'Could not create category',
      })
    }
  }

  @Get(':id/edit')
  async editForm(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const category = await this.categoryService.findOne(id)
    const categories = await this.categoryService.forDropdown(id, category.type)
    res.render('categories/form', {
      ...baseViewModel(req, res, 'Edit Category', 'categories'),
      category,
      categories,
      preselectedParentId: category.parentId || '',
      preselectedType: category.type,
      errors: null,
    })
  }

  @Post(':id/edit')
  @UseInterceptors(FileInterceptor('iconImage', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async update(@UploadedFile() iconFile: any, @Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      const iconPath = this.saveIconImage(iconFile)
      await this.categoryService.update(
        id,
        {
          name: body.name,
          slug: body.slug || undefined,
          parentId: body.parentId || null,
          type: body.type || 'category',
          displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
          icon: iconPath || body.icon || undefined,
          description: body.description || undefined,
          isActive: body.isActive !== undefined ? (body.isActive ? 1 : 0) : undefined,
        },
        req.adminUser.id,
      )
      setFlash(res, this.config, 'Category updated')
      res.redirect('/admin/categories')
    } catch (e: any) {
      const category = await this.categoryService.findOne(id).catch(() => null)
      const categories = await this.categoryService.forDropdown(id, body.type)
      res.render('categories/form', {
        ...baseViewModel(req, res, 'Edit Category', 'categories'),
        category: category || { id, ...body },
        categories,
        preselectedParentId: body.parentId || '',
        preselectedType: body.type || 'category',
        errors: e?.message || 'Could not update category',
      })
    }
  }

  @Get(':id/view')
  async view(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const category = await this.categoryService.findOne(id)
    const breadcrumb = await this.categoryService.breadcrumb(id)
    const children = await this.categoryService.tree(undefined, id)
    res.render('categories/view', {
      ...baseViewModel(req, res, 'View Category', 'categories'),
      category,
      breadcrumb,
      children,
    })
  }

  @Post(':id/upload-icon')
  @UseInterceptors(FileInterceptor('iconImage', { limits: { fileSize: 2 * 1024 * 1024 } }))
  async uploadIcon(@Param('id') id: string, @UploadedFile() file: any, @Res() res: Response) {
    try {
      if (!file?.buffer) throw new Error('No file uploaded')
      const iconPath = this.saveIconImage(file)
      await this.categoryService.update(id, { icon: iconPath as string })
      setFlash(res, this.config, 'Category icon updated')
    } catch (e: any) {
      setFlash(res, this.config, e?.message || 'Could not upload icon')
    }
    res.redirect(`/admin/categories/${id}/view`)
  }

  @Post(':id/toggle-active')
  async toggleActive(@Param('id') id: string, @Res() res: Response) {
    const category = await this.categoryService.findOne(id)
    await this.categoryService.setActive(id, category.isActive ? 0 : 1)
    setFlash(res, this.config, 'Category status updated')
    res.redirect('/admin/categories')
  }

  @Post(':id/delete')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.categoryService.remove(id)
      setFlash(res, this.config, `Category deleted (${result.deletedCount} items)`)
    } catch (e: any) {
      setFlash(res, this.config, e?.message || 'Could not delete category')
    }
    res.redirect('/admin/categories')
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids)
    const action = body.action as 'activate' | 'deactivate' | 'delete'
    const result = await this.categoryService.bulkAction(ids, action)
    let msg = `${result.affected} category(ies) ${action}d`
    if (result.errors?.length) {
      msg += `. Skipped: ${result.errors.join('; ')}`
    }
    setFlash(res, this.config, msg)
    res.redirect('/admin/categories')
  }
}
