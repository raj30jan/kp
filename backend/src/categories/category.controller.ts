import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CategoryService } from './category.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { ListCategoriesDto } from './dto/list-categories.dto'
import { AdminGuard } from '../auth/admin.guard'

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List categories with search, filter, pagination' })
  async list(@Query() query: ListCategoriesDto) {
    return this.categoryService.list(query)
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get full category tree (or subtree by parentId)' })
  async tree(@Query('type') type?: string, @Query('parentId') parentId?: string) {
    return this.categoryService.tree(type, parentId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID' })
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id)
  }

  @Get(':id/breadcrumb')
  @ApiOperation({ summary: 'Get ancestor chain (breadcrumb) for a category' })
  async breadcrumb(@Param('id') id: string) {
    return this.categoryService.breadcrumb(id)
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Create a new category' })
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  async create(@Body() dto: CreateCategoryDto, @Query('userId') userId?: string) {
    return this.categoryService.create(dto, userId)
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Admin] Update a category (including moving to a new parent)' })
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Query('userId') userId?: string) {
    return this.categoryService.update(id, dto, userId)
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '[Admin] Activate a category' })
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  async activate(@Param('id') id: string) {
    return this.categoryService.setActive(id, 1)
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: '[Admin] Deactivate a category' })
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  async deactivate(@Param('id') id: string) {
    return this.categoryService.setActive(id, 0)
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete a category and all its descendants (soft delete)' })
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return this.categoryService.remove(id)
  }
}
