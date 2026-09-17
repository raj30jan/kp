import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull, Not, Like } from 'typeorm'
import { Category } from './entities/category.entity'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { ListCategoriesDto } from './dto/list-categories.dto'

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  // ============ CREATE ============

  async create(dto: CreateCategoryDto, userId?: string): Promise<Category> {
    const slug = (dto.slug || dto.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!slug) throw new BadRequestException('Could not generate a valid slug')

    let level = 0
    let path = ''
    let parent: Category | null = null

    if (dto.parentId) {
      parent = await this.findOne(dto.parentId)
      level = parent.level + 1
      path = `${parent.path}/${parent.id}`
    }

    // Check slug uniqueness among siblings with same parent
    const existing = await this.repo.findOne({
      where: { slug, parentId: dto.parentId ? dto.parentId : IsNull() },
    })
    if (existing) throw new BadRequestException(`Slug "${slug}" already exists at this level`)

    // If parent was previously a leaf, mark it as non-leaf
    if (parent && parent.isLeaf) {
      parent.isLeaf = 0
      await this.repo.save(parent)
    }

    const category = this.repo.create({
      name: dto.name,
      slug,
      parentId: dto.parentId || null,
      level,
      path,
      type: dto.type || 'product',
      isLeaf: 1,
      displayOrder: dto.displayOrder ?? 0,
      isActive: 1,
      icon: dto.icon || null,
      description: dto.description || null,
      createdBy: userId || null,
      updatedBy: userId || null,
    })

    return this.repo.save(category)
  }

  // ============ READ ============

  async findOne(id: string): Promise<Category> {
    const category = await this.repo.findOne({ where: { id } })
    if (!category) throw new NotFoundException('Category not found')
    return category
  }

  /** Flat list with search, sort, pagination — used by admin UI and Swagger API. */
  async list(query: ListCategoriesDto) {
    const page = Math.max(parseInt(query.page || '1', 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(query.limit || '20', 10) || 20, 1), 200)

    const qb = this.repo.createQueryBuilder('c')

    if (query.q) qb.andWhere('(c.name LIKE :q OR c.slug LIKE :q)', { q: `%${query.q}%` })
    if (query.type) qb.andWhere('c.type = :type', { type: query.type })
    if (query.isActive === '1') qb.andWhere('c.isActive = 1')
    if (query.isActive === '0') qb.andWhere('c.isActive = 0')
    if (query.isLeaf === '1') qb.andWhere('c.isLeaf = 1')
    if (query.isLeaf === '0') qb.andWhere('c.isLeaf = 0')
    if (query.parentId === 'null') qb.andWhere('c.parentId IS NULL')
    else if (query.parentId) qb.andWhere('c.parentId = :pid', { pid: query.parentId })

    const sortable = ['displayOrder', 'name', 'slug', 'level', 'createdAt', 'updatedAt']
    const sortCol = sortable.includes(query.sort || '') ? query.sort! : 'displayOrder'
    const dir = query.dir === 'DESC' ? 'DESC' : 'ASC'
    qb.orderBy(`c.${sortCol}`, dir)
      .skip((page - 1) * limit)
      .take(limit)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 }
  }

  /** Full tree (or subtree from a given root) — for frontend dropdowns/menus. */
  async tree(type?: string, parentId?: string): Promise<any[]> {
    const where: any = { deletedAt: IsNull() }
    if (type) where.type = type
    if (parentId) where.parentId = parentId
    else where.parentId = IsNull()

    const roots = await this.repo.find({
      where,
      order: { displayOrder: 'ASC', name: 'ASC' },
    })

    return this.buildTree(roots)
  }

  private async buildTree(nodes: Category[]): Promise<any[]> {
    const result: any[] = []
    for (const node of nodes) {
      const children = await this.repo.find({
        where: { parentId: node.id, deletedAt: IsNull() },
        order: { displayOrder: 'ASC', name: 'ASC' },
      })
      result.push({
        ...node,
        children: children.length ? await this.buildTree(children) : [],
      })
    }
    return result
  }

  /** Get the full ancestor chain (breadcrumb) for a category. */
  async breadcrumb(id: string): Promise<Category[]> {
    const category = await this.findOne(id)
    if (!category.path) return [category]

    const ancestorIds = category.path.split('/').filter(Boolean)
    if (!ancestorIds.length) return [category]

    const ancestors = await this.repo.findByIds(ancestorIds)
    ancestors.sort((a, b) => a.level - b.level)
    return [...ancestors, category]
  }

  /** Get all descendant IDs (for delete / activate / deactivate cascades). */
  async descendantIds(id: string): Promise<string[]> {
    const category = await this.findOne(id)
    const prefix = `${category.path}/${category.id}`
    const descendants = await this.repo
      .createQueryBuilder('c')
      .where('c.path LIKE :prefix', { prefix: `${prefix}%` })
      .getMany()
    return descendants.map((d) => d.id)
  }

  // ============ UPDATE ============

  async update(id: string, dto: UpdateCategoryDto, userId?: string): Promise<Category> {
    const category = await this.findOne(id)

    if (dto.name !== undefined) category.name = dto.name
    if (dto.description !== undefined) category.description = dto.description
    if (dto.icon !== undefined) category.icon = dto.icon
    if (dto.displayOrder !== undefined) category.displayOrder = dto.displayOrder
    if (dto.isActive !== undefined) category.isActive = dto.isActive
    if (dto.type !== undefined) category.type = dto.type

    if (dto.slug !== undefined) {
      const slug = dto.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (!slug) throw new BadRequestException('Invalid slug')
      const existing = await this.repo.findOne({ where: { slug, parentId: category.parentId ? category.parentId : IsNull() } })
      if (existing && existing.id !== id) throw new BadRequestException(`Slug "${slug}" already exists at this level`)
      category.slug = slug
    }

    // Handle parent change (move subtree)
    if (dto.parentId !== undefined) {
      const newParentId = dto.parentId || null

      // Prevent setting self as parent
      if (newParentId === id) throw new BadRequestException('A category cannot be its own parent')

      // Prevent setting a descendant as parent (would create a cycle)
      if (newParentId) {
        const descendantIds = await this.descendantIds(id)
        if (descendantIds.includes(newParentId)) {
          throw new BadRequestException('Cannot move a category under its own descendant')
        }
        const newParent = await this.findOne(newParentId)
        category.level = newParent.level + 1
        category.path = `${newParent.path}/${newParent.id}`
        // Mark old parent as leaf if it has no other children
        if (category.parentId && category.parentId !== newParentId) {
          await this.refreshLeafFlag(category.parentId)
        }
        // Mark new parent as non-leaf
        if (newParent.isLeaf) {
          newParent.isLeaf = 0
          await this.repo.save(newParent)
        }
      } else {
        // Moving to root
        if (category.parentId) {
          await this.refreshLeafFlag(category.parentId)
        }
        category.level = 0
        category.path = ''
        category.parentId = null
      }

      // Update path/level for all descendants
      await this.updateDescendantPaths(id, category.path, category.level)
    }

    category.updatedBy = userId || null
    return this.repo.save(category)
  }

  /** Recalculate the isLeaf flag for a parent after a child is moved/deleted. */
  private async refreshLeafFlag(parentId: string) {
    const count = await this.repo.count({ where: { parentId } })
    if (count === 0) {
      await this.repo.update(parentId, { isLeaf: 1 })
    }
  }

  /** When a category is moved, update path and level for all its descendants. */
  private async updateDescendantPaths(categoryId: string, newParentPath: string, newParentLevel: number) {
    const children = await this.repo.find({ where: { parentId: categoryId } })
    for (const child of children) {
      child.level = newParentLevel + 1
      child.path = `${newParentPath}/${categoryId}`
      await this.repo.save(child)
      await this.updateDescendantPaths(child.id, child.path, child.level)
    }
  }

  // ============ DELETE ============

  async remove(id: string): Promise<{ success: boolean; deletedCount: number }> {
    const category = await this.findOne(id)

    // Collect all descendant IDs
    const allIds = [id, ...(await this.descendantIds(id))]

    // Soft-delete all
    await this.repo.update(allIds, { deletedAt: new Date() })

    // Refresh parent leaf flag
    if (category.parentId) {
      await this.refreshLeafFlag(category.parentId)
    }

    return { success: true, deletedCount: allIds.length }
  }

  // ============ ACTIVATE / DEACTIVATE ============

  async setActive(id: string, isActive: number, userId?: string): Promise<Category> {
    const category = await this.findOne(id)
    category.isActive = isActive
    category.updatedBy = userId || null
    return this.repo.save(category)
  }

  /** Activate/deactivate a category and all its descendants. */
  async setActiveRecursive(id: string, isActive: number): Promise<{ affected: number }> {
    const allIds = [id, ...(await this.descendantIds(id))]
    const result = await this.repo.update(allIds, { isActive })
    return { affected: result.affected ?? 0 }
  }

  // ============ BULK ============

  async bulkAction(ids: string[], action: 'activate' | 'deactivate' | 'delete'): Promise<{ affected: number }> {
    if (!ids.length) return { affected: 0 }

    if (action === 'delete') {
      // Collect all descendants for each ID
      const allIds = new Set<string>()
      for (const id of ids) {
        allIds.add(id)
        const descIds = await this.descendantIds(id)
        descIds.forEach((d) => allIds.add(d))
      }
      const result = await this.repo.update([...allIds], { deletedAt: new Date() })
      return { affected: result.affected ?? 0 }
    }

    const isActive = action === 'activate' ? 1 : 0
    const result = await this.repo.update(ids, { isActive })
    return { affected: result.affected ?? 0 }
  }

  // ============ ADMIN UI HELPERS ============

  /** Admin UI list — same as list() but with consistent return shape. */
  async adminList(
    q?: string,
    type?: string,
    parentId?: string,
    isActive?: string,
    page = 1,
    limit = 20,
    sort = 'displayOrder',
    dir: 'ASC' | 'DESC' = 'ASC',
  ) {
    const qb = this.repo.createQueryBuilder('c')

    if (q) qb.andWhere('(c.name LIKE :q OR c.slug LIKE :q)', { q: `%${q}%` })
    if (type) qb.andWhere('c.type = :type', { type })
    if (isActive === '1') qb.andWhere('c.isActive = 1')
    if (isActive === '0') qb.andWhere('c.isActive = 0')
    if (parentId === 'null') qb.andWhere('c.parentId IS NULL')
    else if (parentId) qb.andWhere('c.parentId = :pid', { pid: parentId })

    const sortable = ['displayOrder', 'name', 'slug', 'level', 'createdAt', 'updatedAt']
    const sortCol = sortable.includes(sort) ? sort : 'displayOrder'
    qb.orderBy(`c.${sortCol}`, dir)
      .skip((page - 1) * limit)
      .take(limit)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1, sort: sortCol, dir }
  }

  /** Get all categories for a parent dropdown (excluding self and descendants). */
  async forDropdown(selfId?: string, type?: string): Promise<Category[]> {
    const qb = this.repo.createQueryBuilder('c').where('c.deletedAt IS NULL')
    if (type) qb.andWhere('c.type = :type', { type })
    if (selfId) {
      const self = await this.findOne(selfId)
      const prefix = `${self.path}/${self.id}`
      qb.andWhere('c.id != :selfId', { selfId })
      qb.andWhere('(c.path NOT LIKE :prefix OR c.path IS NULL)', { prefix: `${prefix}%` })
    }
    qb.orderBy('c.level', 'ASC').addOrderBy('c.name', 'ASC')
    return qb.getMany()
  }
}
