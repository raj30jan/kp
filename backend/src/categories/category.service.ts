import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository, IsNull, Not, Like } from 'typeorm'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { Category } from './entities/category.entity'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { ListCategoriesDto } from './dto/list-categories.dto'

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
    private readonly dataSource: DataSource,
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

    // Look up the active status_id for categories from status_master
    let statusId: number = 1
    try {
      const statusRows = await this.dataSource.query(
        `SELECT id FROM status_master WHERE entity_type = 'category' AND code = 'active' AND is_active = 1 LIMIT 1`
      )
      if (statusRows.length > 0) statusId = Number(statusRows[0].id)
    } catch {
      // status_master table might not exist — fallback to 1
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
      statusId,
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

    // Prevent deletion if the category has direct children
    const childCount = await this.repo.count({ where: { parentId: id } })
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" — it has ${childCount} child category(ies). Delete or move them first.`,
      )
    }

    // Physically delete
    await this.repo.delete(id)

    // Refresh parent leaf flag
    if (category.parentId) {
      await this.refreshLeafFlag(category.parentId)
    }

    return { success: true, deletedCount: 1 }
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

  async bulkAction(ids: string[], action: 'activate' | 'deactivate' | 'delete'): Promise<{ affected: number; errors?: string[] }> {
    if (!ids.length) return { affected: 0 }

    if (action === 'delete') {
      // Check each category for children before deleting
      const errors: string[] = []
      const deletableIds: string[] = []
      for (const id of ids) {
        const category = await this.repo.findOne({ where: { id } })
        if (!category) continue
        const childCount = await this.repo.count({ where: { parentId: id } })
        if (childCount > 0) {
          errors.push(`"${category.name}" has ${childCount} child(ren) — skipped`)
        } else {
          deletableIds.push(id)
        }
      }
      if (deletableIds.length > 0) {
        const result = await this.repo.delete(deletableIds)
        return { affected: result.affected ?? 0, errors }
      }
      return { affected: 0, errors }
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
  async forDropdown(selfId?: string, _type?: string): Promise<Category[]> {
    const qb = this.repo.createQueryBuilder('c').where('c.deletedAt IS NULL')
    if (selfId) {
      const self = await this.findOne(selfId)
      const prefix = `${self.path}/${self.id}`
      qb.andWhere('c.id != :selfId', { selfId })
      qb.andWhere('(c.path NOT LIKE :prefix OR c.path IS NULL)', { prefix: `${prefix}%` })
    }
    qb.orderBy('c.level', 'ASC').addOrderBy('c.name', 'ASC')
    return qb.getMany()
  }

  /** Get all categories as a flat list sorted for tree display. */
  async treeFlat(type?: string, q?: string): Promise<any[]> {
    const qb = this.repo.createQueryBuilder('c').where('c.deletedAt IS NULL')
    if (type) qb.andWhere('c.type = :type', { type })
    if (q) qb.andWhere('(c.name LIKE :q OR c.slug LIKE :q)', { q: `%${q}%` })
    qb.orderBy('c.level', 'ASC').addOrderBy('c.displayOrder', 'ASC').addOrderBy('c.name', 'ASC')
    const items = await qb.getMany()
    // Build a map of children by parentId
    const childMap = new Map<string, any[]>()
    const roots: any[] = []
    for (const c of items) {
      const node = { ...c, children: [] }
      if (c.parentId) {
        if (!childMap.has(c.parentId)) childMap.set(c.parentId, [])
        childMap.get(c.parentId)!.push(node)
      } else {
        roots.push(node)
      }
    }
    // Recursively attach children
    const attach = (node: any) => {
      const kids = childMap.get(node.id) || []
      node.children = kids
      node.hasChildren = kids.length > 0
      for (const k of kids) attach(k)
    }
    for (const r of roots) attach(r)
    return roots
  }

  // ============ EXCEL IMPORT ============

  async importExcel(buffer: Buffer, userId?: string, generateImages = false) {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) throw new BadRequestException('Excel file has no sheets')
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

    if (!rows.length) throw new BadRequestException('Excel file is empty')

    // Look up the active status_id for categories from status_master
    let statusId: number = 1
    try {
      const statusRows = await this.dataSource.query(
        `SELECT id FROM status_master WHERE entity_type = 'category' AND code = 'active' AND is_active = 1 LIMIT 1`
      )
      if (statusRows.length > 0) statusId = Number(statusRows[0].id)
    } catch {
      // status_master table might not exist — fallback to 1
    }

    const created: any[] = []
    const errors: string[] = []

    // Build a slug->category map for parent lookup by slug
    const allCats = await this.repo.find({ where: { deletedAt: IsNull() } })
    const slugMap = new Map(allCats.map((c) => [c.slug, c]))

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Excel row (1 = header)
      const name = String(row.name || row.Name || '').trim()
      if (!name) {
        errors.push(`Row ${rowNum}: name is required`)
        continue
      }

      const type = String(row.type || row.Type || 'category').trim() as 'category' | 'subcategory'
      const slugRaw = String(row.slug || row.Slug || '').trim()
      const slug = (slugRaw || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const parentSlug = String(row.parentSlug || row.ParentSlug || '').trim()
      const displayOrder = Number(row.displayOrder || row.DisplayOrder || 0) || 0
      const iconUrl = String(row.iconUrl || row.IconUrl || row.iconurl || '').trim()
      const icon = String(row.icon || row.Icon || '').trim() || null
      const description = String(row.description || row.Description || '').trim() || null

      // If iconUrl is provided, resolve the image (HTTP URL or local file path)
      let finalIcon = icon
      if (iconUrl) {
        try {
          if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
            finalIcon = await this.downloadIconImage(iconUrl, slug)
          } else {
            finalIcon = await this.copyLocalIconImage(iconUrl, slug)
          }
        } catch (e: any) {
          errors.push(`Row ${rowNum}: could not load icon image from "${iconUrl}" — ${e?.message || 'unknown error'}`)
        }
      }

      // Resolve parent — if not found, create as root (don't skip!)
      let parentId: string | null = null
      let resolvedParentSlug: string | null = null
      if (parentSlug) {
        const parent = slugMap.get(parentSlug)
        if (parent) {
          parentId = parent.id
          resolvedParentSlug = parentSlug
        } else {
          const lowerParentSlug = parentSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          const parentByAltSlug = slugMap.get(lowerParentSlug)
          if (parentByAltSlug) {
            parentId = parentByAltSlug.id
            resolvedParentSlug = lowerParentSlug
          } else {
            errors.push(`Row ${rowNum}: parent slug "${parentSlug}" not found — creating as root`)
          }
        }
      }

      try {
        const existing = await this.repo.findOne({ where: { slug, parentId: parentId ? parentId : IsNull() } })
        if (existing) {
          // Update existing category — don't skip!
          // If AI generation is enabled, always regenerate the icon based on the name
          if (generateImages) {
            try {
              console.log(`[AI Image] Generating for existing "${name}" (row ${rowNum})…`)
              const generatedIcon = await this.generateIconImage(name, slug)
              await new Promise((r) => setTimeout(r, 500))
              existing.icon = generatedIcon
              console.log(`[AI Image] OK for existing "${name}" → ${generatedIcon}`)
            } catch (e: any) {
              errors.push(`Row ${rowNum}: AI image generation failed for existing "${name}" — ${e?.message || 'unknown error'}`)
              console.error(`[AI Image] FAILED for existing "${name}" — ${e?.message}`)
            }
          } else if (finalIcon) {
            existing.icon = finalIcon
          }
          // Update other fields too
          existing.name = name
          existing.type = type
          existing.displayOrder = displayOrder
          existing.description = description
          await this.repo.save(existing)
          slugMap.set(slug, existing)
          created.push(existing)
          continue
        }

        let level = 0
        let path = ''
        let parent: Category | null = null
        if (parentId && resolvedParentSlug) {
          parent = slugMap.get(resolvedParentSlug)!
          level = parent.level + 1
          path = `${parent.path}/${parent.id}`
          if (parent.isLeaf) {
            parent.isLeaf = 0
            await this.repo.save(parent)
          }
        }

        // Generate AI image AFTER all validation passes, right before creating
        if (generateImages) {
          try {
            console.log(`[AI Image] Generating for "${name}" (row ${rowNum}, level ${level})…`)
            finalIcon = await this.generateIconImage(name, slug)
            await new Promise((r) => setTimeout(r, 500))
            console.log(`[AI Image] OK for "${name}" → ${finalIcon}`)
          } catch (e: any) {
            errors.push(`Row ${rowNum}: AI image generation failed for "${name}" — ${e?.message || 'unknown error'}`)
            console.error(`[AI Image] FAILED for "${name}" — ${e?.message}`)
          }
        }

        const category = this.repo.create({
          name,
          slug,
          parentId,
          level,
          path,
          type,
          isLeaf: 1,
          displayOrder,
          isActive: 1,
          statusId,
          icon: finalIcon,
          description,
          createdBy: userId || null,
          updatedBy: userId || null,
        })
        const saved = await this.repo.save(category)
        slugMap.set(slug, saved)
        created.push(saved)
      } catch (e: any) {
        errors.push(`Row ${rowNum}: ${e?.message || 'Could not create category'}`)
      }
    }

    console.log(`[Import] Done. Created: ${created.length}, Errors: ${errors.length}, Total rows: ${rows.length}`)
    return { created: created.length, errors, total: rows.length }
  }

  /** Copy a local icon image file to uploads/categories/ */
  private async copyLocalIconImage(srcPath: string, slugPrefix: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'categories')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    // Resolve the source path relative to project root
    const resolvedSrc = path.isAbsolute(srcPath)
      ? srcPath
      : path.join(process.cwd(), srcPath)

    if (!fs.existsSync(resolvedSrc)) {
      throw new Error(`File not found: ${srcPath} (resolved: ${resolvedSrc})`)
    }

    const ext = path.extname(resolvedSrc).toLowerCase() || '.png'
    const filename = `${slugPrefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    const destPath = path.join(uploadsDir, filename)

    const stat = fs.statSync(resolvedSrc)
    if (stat.size > 2 * 1024 * 1024) {
      throw new Error('Image too large (max 2MB)')
    }

    fs.copyFileSync(resolvedSrc, destPath)
    return `/uploads/categories/${filename}`
  }

  /** Download an icon image from a URL and save it to uploads/categories/ */
  private async downloadIconImage(url: string, slugPrefix: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'categories')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    // Determine file extension from URL or content-type
    const urlExt = path.extname(new URL(url).pathname).toLowerCase()
    const validExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif']
    const ext = validExts.includes(urlExt) ? urlExt : '.png'
    const filename = `${slugPrefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Fetch the image
    const http = await import(url.startsWith('https') ? 'https' : 'http')
    return new Promise<string>((resolve, reject) => {
      const req = http.get(url, { timeout: 10000 }, (resp: any) => {
        if (resp.statusCode && (resp.statusCode < 200 || resp.statusCode >= 300)) {
          reject(new Error(`HTTP ${resp.statusCode}`))
          return
        }
        const contentType = resp.headers['content-type'] || ''
        if (!contentType.startsWith('image/')) {
          reject(new Error(`Not an image (content-type: ${contentType})`))
          return
        }
        const chunks: Buffer[] = []
        resp.on('data', (chunk: Buffer) => chunks.push(chunk))
        resp.on('end', () => {
          const buf = Buffer.concat(chunks)
          if (buf.length > 2 * 1024 * 1024) {
            reject(new Error('Image too large (max 2MB)'))
            return
          }
          fs.writeFileSync(filepath, buf)
          resolve(`/uploads/categories/${filename}`)
        })
        resp.on('error', reject)
      })
      req.on('error', reject)
      req.on('timeout', () => reject(new Error('Download timeout')))
    })
  }

  /** Generate an icon image using Pollinations.ai (free, no API key needed) */
  private async generateIconImage(categoryName: string, slugPrefix: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'categories')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const prompt = encodeURIComponent(
      `realistic photo of ${categoryName}, agricultural product, white background, sharp focus, no text`,
    )

    const https = await import('https')

    const fetchImage = (url: string): Promise<Buffer> => {
      return new Promise<Buffer>((resolve, reject) => {
        const req = https.get(url, { timeout: 30000 }, (resp: any) => {
          if (resp.statusCode === 301 || resp.statusCode === 302) {
            const redirectUrl = resp.headers.location
            if (redirectUrl) {
              fetchImage(redirectUrl).then(resolve).catch(reject)
              return
            }
          }
          if (resp.statusCode && (resp.statusCode < 200 || resp.statusCode >= 300)) {
            let body = ''
            resp.on('data', (c: any) => (body += c))
            resp.on('end', () => reject(new Error(`HTTP ${resp.statusCode}: ${body.substring(0, 150)}`)))
            return
          }
          const chunks: Buffer[] = []
          resp.on('data', (chunk: Buffer) => chunks.push(chunk))
          resp.on('end', () => {
            const buf = Buffer.concat(chunks)
            if (buf.length < 1000) {
              reject(new Error('Response too small — possibly an error'))
              return
            }
            resolve(buf)
          })
          resp.on('error', reject)
        })
        req.on('error', reject)
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')) })
      })
    }

    // Retry up to 2 times with short delay
    const maxRetries = 2
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const seed = Math.floor(Math.random() * 1000000)
      const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=128&height=128&nologo=true&model=turbo&seed=${seed}`
      try {
        const buf = await fetchImage(imageUrl)
        // Compress to JPEG if > 100KB
        let finalBuf = buf
        const filename = `${slugPrefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`
        const filepath = path.join(uploadsDir, filename)
        if (buf.length > 100 * 1024) {
          // Use sharp to compress if available, otherwise just save as-is
          try {
            const sharp = require('sharp')
            finalBuf = await sharp(buf).resize(128, 128).jpeg({ quality: 80 }).toBuffer()
          } catch {
            // sharp not installed — save as-is
            finalBuf = buf
          }
        }
        fs.writeFileSync(filepath, finalBuf)
        return `/uploads/categories/${filename}`
      } catch (e: any) {
        if (attempt === maxRetries) throw e
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
    throw new Error('All retry attempts failed')
  }
}
