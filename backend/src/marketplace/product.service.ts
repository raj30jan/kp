import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'
import { Product } from './entities/product.entity'
import { ProductContact } from './entities/product-contact.entity'
import { MarketplaceProductHistory } from './entities/product-history.entity'
import { ProductReaction } from './entities/product-reaction.entity'
import { CreateProductDto } from './dto/create-product.dto'
import { ListProductsDto } from './dto/list-products.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { DataSyncService } from '../mongo/data-sync.service'
import { saveProductImages, deleteProductImages } from './product-image.util'
import { detectCategoryFromQuery } from './product-search.util'
import { MembershipService } from '../membership/membership.service'
import { ActivityLogService } from '../mongo/activity-log.service'
import { NotificationService } from '../notifications/notification.service'

const HISTORY_TRACKED_FIELDS = [
  'title',
  'description',
  'category',
  'subCategory',
  'price',
  'priceUnit',
  'quantity',
  'quantityUnit',
  'location',
  'state',
  'district',
  'mobile',
  'email',
] as const

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductContact)
    private readonly contactRepo: Repository<ProductContact>,
    @InjectRepository(MarketplaceProductHistory)
    private readonly historyRepo: Repository<MarketplaceProductHistory>,
    @InjectRepository(ProductReaction)
    private readonly reactionRepo: Repository<ProductReaction>,
    private readonly dataSync: DataSyncService,
    private readonly config: ConfigService,
    private readonly membershipService: MembershipService,
    private readonly activityLog: ActivityLogService,
    private readonly notificationService: NotificationService,
  ) {}

  /** Records one history row per changed field, diffing `dto` against the current product. */
  private async recordHistory(
    product: Product,
    dto: Record<string, any>,
    changedBy: string | null,
    changedByRole: string | null,
  ) {
    const rows: Partial<MarketplaceProductHistory>[] = []
    for (const field of HISTORY_TRACKED_FIELDS) {
      if (!(field in dto)) continue
      const oldValue = (product as any)[field]
      const newValue = dto[field]
      if (String(oldValue ?? '') === String(newValue ?? '')) continue
      rows.push({
        productId: product.id,
        fieldName: field,
        oldValue: oldValue == null ? null : String(oldValue),
        newValue: newValue == null ? null : String(newValue),
        changedBy,
        changedByRole,
      })
    }
    if (rows.length) {
      await this.historyRepo.save(rows.map((r) => this.historyRepo.create(r)))
    }
    return rows.length
  }

  private get activeDays(): number {
    return this.config.get<number>('PRODUCT_ACTIVE_DAYS') ?? 15
  }

  private mirror(saved: Product) {
    this.dataSync
      .mirror({ entity: 'product', refId: saved.id, payload: saved as unknown as Record<string, any> })
      .catch((err) => {
        console.warn('[DataSync] product mirror failed:', err.message)
      })
  }

  /**
   * Create a new listing. sellerId comes from the verified JWT (never from
   * the request body) so every product is correctly mapped to its owner.
   * New listings start as `pending` — they only go live once an admin
   * activates them (see `activate()` below).
   */
  async create(
    dto: CreateProductDto,
    sellerId: string,
    files?: Array<{ buffer: Buffer; originalname: string }>,
  ) {
    if (!sellerId) throw new BadRequestException('Login required to post a product')
    if (!dto.category) throw new BadRequestException('category is required')

    // Enforce free-tier lifetime cap (5 listings) unless the seller has an
    // active paid membership. Throws ForbiddenException if the cap is hit.
    await this.membershipService.consumeFreeListing(sellerId)

    const id = uuidv4()
    const imageUrls = files && files.length ? await saveProductImages(dto.category, id, files) : null

    const product = this.productRepo.create({
      ...dto,
      id,
      sellerId,
      imageUrls,
      status: 'pending',
      activatedAt: null,
      expiresAt: null,
    })
    const saved = await this.productRepo.save(product)
    this.mirror(saved)
    return saved
  }

  /** Owner-only delete: removes the DB row AND the on-disk image folder. */
  async remove(id: string, sellerId: string) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product')
    deleteProductImages(product.category, product.id)
    await this.productRepo.delete({ id })
    return { success: true }
  }

  /** Admin approves a pending/rejected listing — makes it visible for `activeDays`. */
  async activate(id: string) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    const now = new Date()
    product.status = 'active'
    product.activatedAt = now
    product.expiresAt = new Date(now.getTime() + this.activeDays * 24 * 60 * 60 * 1000)
    const saved = await this.productRepo.save(product)
    this.mirror(saved)
    return saved
  }

  /** Admin rejects a pending listing. */
  async reject(id: string) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    product.status = 'rejected'
    return this.productRepo.save(product)
  }

  /**
   * Seller reactivates their own expired listing (same product, still
   * available) without needing fresh admin approval — goes straight back
   * to active for another `activeDays` window.
   */
  async reactivate(id: string, sellerId: string) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product')
    if (product.status !== 'expired') {
      throw new BadRequestException('Only expired listings can be reactivated')
    }
    const now = new Date()
    product.status = 'active'
    product.activatedAt = now
    product.expiresAt = new Date(now.getTime() + this.activeDays * 24 * 60 * 60 * 1000)
    const saved = await this.productRepo.save(product)
    this.mirror(saved)
    return saved
  }

  /** Cron entry point: flips any active-but-past-expiry listings to `expired`. */
  async expireOverdue() {
    const result = await this.productRepo
      .createQueryBuilder()
      .update(Product)
      .set({ status: 'expired' })
      .where('status = :status AND expiresAt IS NOT NULL AND expiresAt < :now', {
        status: 'active',
        now: new Date(),
      })
      .execute()
    return result.affected ?? 0
  }

  /** Products pending admin review. */
  async listPending() {
    return this.productRepo.find({ where: { status: 'pending' }, order: { createdAt: 'ASC' } })
  }

  /** [Admin UI] List listings across any status (or all), searchable/sortable, paginated. */
  async adminList(
    status?: string,
    page = 1,
    limit = 20,
    q?: string,
    sort: string = 'createdAt',
    dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const qb = this.productRepo.createQueryBuilder('p')
    if (status) qb.andWhere('p.status = :status', { status })
    if (q) qb.andWhere('(p.title LIKE :q OR p.category LIKE :q OR p.location LIKE :q)', { q: `%${q}%` })

    const sortable = ['createdAt', 'price', 'title', 'status', 'views']
    const sortCol = sortable.includes(sort) ? sort : 'createdAt'
    qb.orderBy(`p.${sortCol}`, dir === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1, sort: sortCol, dir }
  }

  /** [Admin UI] Create a listing directly from the admin panel (e.g. on behalf of a seller). */
  async adminCreate(dto: CreateProductDto & { sellerId?: string; status?: string }) {
    const id = uuidv4()
    const product = this.productRepo.create({
      ...dto,
      id,
      sellerId: dto.sellerId || null,
      imageUrls: null,
      status: dto.status || 'pending',
      activatedAt: null,
      expiresAt: null,
    })
    const saved = await this.productRepo.save(product)
    this.mirror(saved)
    return saved
  }

  /** [Admin UI] Fetch a single listing regardless of status (for edit forms). */
  async adminFindOne(id: string) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  /** [Admin UI] Edit any field of an existing listing (admins may change the title; sellers may not). */
  async adminUpdate(id: string, dto: Partial<CreateProductDto> & { status?: string }, adminId?: string) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    await this.recordHistory(product, dto, adminId || null, 'admin')
    Object.assign(product, dto)
    const saved = await this.productRepo.save(product)
    this.mirror(saved)
    return saved
  }

  /** [Admin UI] Physically delete a listing and its contacts. */
  async adminDelete(id: string) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    // Check for child records (contacts)
    const contactCount = await this.contactRepo.count({ where: { productId: id } })
    if (contactCount > 0) {
      throw new BadRequestException(
        `Cannot delete product "${product.title}" — it has ${contactCount} contact enquiry record(s). Delete them first.`,
      )
    }
    // Delete product images from disk
    if (product.imageUrls?.length) {
      try { deleteProductImages(product.category, product.id) } catch {}
    }
    await this.productRepo.delete(id)
    return product
  }

  /** [Admin UI] Bulk approve/reject/delete for multi-selected rows. */
  async bulkAction(ids: string[], action: 'activate' | 'reject' | 'delete') {
    if (!ids.length) return { affected: 0 }

    if (action === 'delete') {
      // Check each product for child contacts before deleting
      const errors: string[] = []
      const deletableIds: string[] = []
      for (const id of ids) {
        const product = await this.productRepo.findOne({ where: { id } })
        if (!product) continue
        const contactCount = await this.contactRepo.count({ where: { productId: id } })
        if (contactCount > 0) {
          errors.push(`"${product.title}" has ${contactCount} contact record(s) — skipped`)
        } else {
          if (product.imageUrls?.length) {
            try { deleteProductImages(product.category, product.id) } catch {}
          }
          deletableIds.push(id)
        }
      }
      if (deletableIds.length > 0) {
        await this.productRepo.delete(deletableIds)
      }
      return { affected: deletableIds.length, errors }
    }

    const status = action === 'activate' ? 'active' : 'rejected'
    const now = new Date()
    const qb = this.productRepo.createQueryBuilder().update(Product).where('id IN (:...ids)', { ids })
    if (status === 'active') {
      qb.set({ status, activatedAt: now, expiresAt: new Date(now.getTime() + this.activeDays * 24 * 60 * 60 * 1000) })
    } else {
      qb.set({ status })
    }
    const result = await qb.execute()
    return { affected: result.affected ?? 0 }
  }

  /** [Admin UI] Counts of listings grouped by status, for dashboard KPIs. */
  async countsByStatus() {
    const rows = await this.productRepo
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.status')
      .getRawMany()
    return rows.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {} as Record<string, number>)
  }

  async list(query: ListProductsDto, sellerId?: string) {
    const page = Math.max(parseInt(query.page || '1', 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(query.limit || '12', 10) || 12, 1), 50)

    // Sellers viewing "my products" see everything they own (any status);
    // public browsing only ever shows admin-approved, still-live listings.
    const where: any = sellerId ? { sellerId } : { status: 'active' }
    if (query.category) where.category = query.category
    if (query.state) where.state = query.state
    if (query.district) where.district = query.district

    const [items, total] = await this.productRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Text search across title/description/category, plus a simple
    // local-language -> category synonym match so buyers searching in
    // Hindi/transliterated terms still find relevant listings.
    let filtered = items
    if (query.q) {
      const q = query.q.toLowerCase()
      const detectedCategory = detectCategoryFromQuery(q)
      filtered = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.titleHi || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (detectedCategory && p.category === detectedCategory),
      )
    }

    return {
      items: filtered,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    }
  }

  async findById(id: string) {
    const product = await this.productRepo.findOne({ where: { id, status: 'active' } })
    if (!product) throw new NotFoundException('Product not found')
    await this.productRepo.increment({ id }, 'views', 1)
    product.views = (product.views || 0) + 1
    return product
  }

  /**
   * Highlighted "large land parcel" listings — active Land/Property products
   * with an area (stored in the generic quantity/quantityUnit columns, unit
   * = 'acre') greater than `minAcres`. Used to power the Marketplace banner
   * and the Dashboard KPI badge.
   */
  async findLargeLandParcels(minAcres = 10) {
    const items = await this.productRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'active' })
      .andWhere('(p.category = :land OR p.category LIKE :landPrefix)', { land: 'land', landPrefix: 'land-%' })
      .andWhere('p.quantityUnit = :unit', { unit: 'acre' })
      .andWhere('p.quantity > :minAcres', { minAcres })
      .orderBy('p.quantity', 'DESC')
      .getMany()
    return { items, total: items.length, minAcres }
  }

  async findCategories() {
    const rows = await this.productRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .where('p.status = :status', { status: 'active' })
      .orderBy('p.category', 'ASC')
      .getRawMany()
    return rows.map((r) => r.category)
  }

  /** Public category tree for marketplace filters and sell forms. */
  async findActiveCategoryTree(): Promise<any[]> {
    const qb = this.productRepo.manager
      .getRepository('categories')
      .createQueryBuilder('c')
      .where('c.deletedAt IS NULL')
      .andWhere('c.isActive = 1')
      .orderBy('c.level', 'ASC')
      .addOrderBy('c.displayOrder', 'ASC')
      .addOrderBy('c.name', 'ASC')
    const items = await qb.getMany()

    const childMap = new Map<string, any[]>()
    const roots: any[] = []
    for (const c of items) {
      const node = { ...c, children: [] as any[] }
      if (c.parentId) {
        if (!childMap.has(c.parentId)) childMap.set(c.parentId, [])
        childMap.get(c.parentId)!.push(node)
      } else {
        roots.push(node)
      }
    }
    const attach = (node: any) => {
      const kids = childMap.get(node.id) || []
      node.children = kids
      for (const k of kids) attach(k)
    }
    for (const r of roots) attach(r)
    return roots
  }

  /**
   * Buyer reveals a seller's contact details for a product. Idempotent per
   * (product, buyer) pair — repeat calls don't consume extra free-tier
   * quota. Counts toward the buyer's lifetime purchase-interaction history.
   */
  async contactSeller(productId: string, buyerId: string) {
    const product = await this.productRepo.findOne({ where: { id: productId, status: 'active' } })
    if (!product) throw new NotFoundException('Product not found')
    if (product.sellerId === buyerId) {
      throw new BadRequestException('You cannot contact yourself for your own product')
    }

    const existing = await this.contactRepo.findOne({ where: { productId, buyerId } })
    if (!existing) {
      await this.membershipService.consumeFreeContact(buyerId)
      await this.contactRepo.save(
        this.contactRepo.create({ productId, buyerId, sellerId: product.sellerId || '' }),
      )
      if (product.sellerId) {
        await this.notificationService.notifyUser({
          userId: product.sellerId,
          type: 'product.contact',
          title: `A buyer is interested in your product "${product.title}"`,
          message: `A buyer just viewed your contact details for "${product.title}" and may reach out to purchase it.`,
          relatedType: 'marketplace_product',
          relatedId: productId,
        })
      }
      this.activityLog.log({ action: 'product.contact', userId: buyerId, meta: { productId, sellerId: product.sellerId } })
    }

    return { mobile: product.mobile, email: product.email, sellerId: product.sellerId }
  }

  /**
   * Seller self-service edit from the dashboard. Title is locked — attempting
   * to send a different title throws. All other changed fields are recorded
   * into `marketplace_product_history` before being applied.
   */
  async updateBySeller(id: string, sellerId: string, dto: UpdateProductDto & { title?: string }) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product')

    if (dto.title !== undefined && dto.title !== product.title) {
      throw new BadRequestException(
        'The product title cannot be changed after listing. Contact an admin if this needs correcting.',
      )
    }
    const { title, ...rest } = dto as any

    const changedCount = await this.recordHistory(product, rest, sellerId, 'user')
    Object.assign(product, rest)
    const saved = await this.productRepo.save(product)
    this.mirror(saved)

    this.activityLog.log({
      action: 'product.update',
      userId: sellerId,
      meta: { productId: id, fieldsChanged: changedCount },
    })

    return saved
  }

  /** Seller (or admin) views the full edit history of a product. */
  async getEditHistory(id: string, sellerId?: string) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    if (sellerId && product.sellerId !== sellerId) throw new ForbiddenException('Not your product')
    const items = await this.historyRepo.find({ where: { productId: id }, order: { createdAt: 'DESC' } })
    return { items }
  }

  /**
   * Buyer/visitor likes or dislikes a product. One reaction per user per
   * product — sending the same/opposite reaction again just updates it.
   * The seller is notified (email, SMS fallback) and an admin_notification
   * row is recorded so admins stay aware too.
   */
  async react(productId: string, userId: string, reaction: 'like' | 'dislike') {
    const product = await this.productRepo.findOne({ where: { id: productId, status: 'active' } })
    if (!product) throw new NotFoundException('Product not found')

    const existing = await this.reactionRepo.findOne({ where: { productId, userId } })
    const isNew = !existing
    const changed = existing?.reaction !== reaction
    if (existing) {
      existing.reaction = reaction
      await this.reactionRepo.save(existing)
    } else {
      await this.reactionRepo.save(this.reactionRepo.create({ productId, userId, reaction }))
    }

    const [likes, dislikes] = await Promise.all([
      this.reactionRepo.count({ where: { productId, reaction: 'like' } }),
      this.reactionRepo.count({ where: { productId, reaction: 'dislike' } }),
    ])

    if ((isNew || changed) && product.sellerId && product.sellerId !== userId) {
      await this.notificationService.notifyUser({
        userId: product.sellerId,
        type: `product.${reaction}`,
        title: `Someone ${reaction}d your product "${product.title}"`,
        message: `Your listing "${product.title}" received a new ${reaction}. It now has ${likes} like(s) and ${dislikes} dislike(s).`,
        relatedType: 'marketplace_product',
        relatedId: productId,
      })
    }

    this.activityLog.log({ action: `product.${reaction}`, userId, meta: { productId } })
    return { likes, dislikes }
  }

  /**
   * Seller's dashboard insight card for one product: views, unique buyer
   * contacts, and like/dislike counts — answers "how many people showed
   * interest / wanted to purchase this".
   */
  async getInsights(id: string, sellerId: string) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    if (product.sellerId !== sellerId) throw new ForbiddenException('Not your product')

    const [contacts, likes, dislikes] = await Promise.all([
      this.contactRepo.find({ where: { productId: id }, order: { createdAt: 'DESC' } }),
      this.reactionRepo.count({ where: { productId: id, reaction: 'like' } }),
      this.reactionRepo.count({ where: { productId: id, reaction: 'dislike' } }),
    ])

    return {
      views: product.views,
      contactsCount: contacts.length,
      likes,
      dislikes,
      contacts: contacts.map((c) => ({ buyerId: c.buyerId, contactedAt: c.createdAt })),
    }
  }

  /** Buyer's lifetime purchase/interest history (products they've contacted). */
  async myPurchases(buyerId: string) {
    const contacts = await this.contactRepo.find({ where: { buyerId }, order: { createdAt: 'DESC' } })
    if (!contacts.length) return { items: [] }

    const productIds = contacts.map((c) => c.productId)
    const products = await this.productRepo.findByIds(productIds)
    const productMap = new Map(products.map((p) => [p.id, p]))

    return {
      items: contacts.map((c) => ({
        contactedAt: c.createdAt,
        product: productMap.get(c.productId) || null,
      })),
    }
  }

  // ============ EXCEL IMPORT ============

  async importExcel(buffer: Buffer) {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) throw new BadRequestException('Excel file has no sheets')
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

    if (!rows.length) throw new BadRequestException('Excel file is empty')

    const validPriceUnits = ['per_kg', 'per_piece', 'per_quintal', 'per_litre']
    const created: any[] = []
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      const title = String(row.title || row.Title || '').trim()
      if (!title) {
        errors.push(`Row ${rowNum}: title is required`)
        continue
      }

      const category = String(row.category || row.Category || '').trim()
      if (!category) {
        errors.push(`Row ${rowNum}: category is required`)
        continue
      }

      const price = Number(row.price || row.Price || 0)
      if (!price || price < 0) {
        errors.push(`Row ${rowNum}: price must be a non-negative number`)
        continue
      }

      const priceUnit = String(row.priceUnit || row.PriceUnit || '').trim()
      if (!validPriceUnits.includes(priceUnit)) {
        errors.push(`Row ${rowNum}: priceUnit must be one of ${validPriceUnits.join(', ')}`)
        continue
      }

      try {
        const id = uuidv4()
        const product = this.productRepo.create({
          id,
          title,
          description: String(row.description || row.Description || '').trim() || undefined,
          category,
          subCategory: String(row.subCategory || row.SubCategory || '').trim() || undefined,
          price,
          priceUnit,
          quantity: row.quantity || row.Quantity ? Number(row.quantity || row.Quantity) : undefined,
          quantityUnit: String(row.quantityUnit || row.QuantityUnit || '').trim() || undefined,
          location: String(row.location || row.Location || '').trim() || undefined,
          state: String(row.state || row.State || '').trim() || undefined,
          district: String(row.district || row.District || '').trim() || undefined,
          mobile: String(row.mobile || row.Mobile || '').trim() || undefined,
          email: String(row.email || row.Email || '').trim() || undefined,
          sellerId: null,
          imageUrls: null,
          status: String(row.status || row.Status || 'pending').trim(),
          activatedAt: null,
          expiresAt: null,
        })
        const saved = await this.productRepo.save(product)
        this.mirror(saved)
        created.push(saved)
      } catch (e: any) {
        errors.push(`Row ${rowNum}: ${e?.message || 'Could not create product'}`)
      }
    }

    return { created: created.length, errors, total: rows.length }
  }
}
