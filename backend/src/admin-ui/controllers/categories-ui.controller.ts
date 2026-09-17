import { Body, Controller, Get, Param, Post, Query, Req, Res, UseFilters, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
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
  ) {
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
    })
  }

  @Get('new')
  async newForm(@Req() req: any, @Res() res: Response, @Query('parentId') parentId?: string, @Query('type') type?: string) {
    const categories = await this.categoryService.forDropdown(undefined, type)
    res.render('categories/form', {
      ...baseViewModel(req, res, 'Add Category', 'categories'),
      category: null,
      categories,
      preselectedParentId: parentId || '',
      preselectedType: type || 'product',
      errors: null,
    })
  }

  @Post('new')
  async create(@Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      await this.categoryService.create(
        {
          name: body.name,
          slug: body.slug || undefined,
          parentId: body.parentId || null,
          type: body.type || 'product',
          displayOrder: body.displayOrder ? Number(body.displayOrder) : 0,
          icon: body.icon || undefined,
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
        preselectedType: body.type || 'product',
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
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any, @Res() res: Response) {
    try {
      await this.categoryService.update(
        id,
        {
          name: body.name,
          slug: body.slug || undefined,
          parentId: body.parentId || null,
          type: body.type || undefined,
          displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
          icon: body.icon || undefined,
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
        preselectedType: body.type || 'product',
        errors: e?.message || 'Could not update category',
      })
    }
  }

  @Get(':id/view')
  async view(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const category = await this.categoryService.findOne(id)
    const breadcrumb = await this.categoryService.breadcrumb(id)
    const children = await this.categoryService.tree(category.type, id)
    res.render('categories/view', {
      ...baseViewModel(req, res, 'View Category', 'categories'),
      category,
      breadcrumb,
      children,
    })
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
    const result = await this.categoryService.remove(id)
    setFlash(res, this.config, `Category deleted (${result.deletedCount} items including descendants)`)
    res.redirect('/admin/categories')
  }

  @Post('bulk')
  async bulk(@Body() body: any, @Res() res: Response) {
    const ids = parseIds(body.ids)
    const action = body.action as 'activate' | 'deactivate' | 'delete'
    const result = await this.categoryService.bulkAction(ids, action)
    setFlash(res, this.config, `${result.affected} category(ies) ${action}d`)
    res.redirect('/admin/categories')
  }
}
