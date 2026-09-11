import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { Product } from './entities/product.entity'
import { ProductContact } from './entities/product-contact.entity'
import { CreateProductDto } from './dto/create-product.dto'
import { ListProductsDto } from './dto/list-products.dto'
import { DataSyncService } from '../mongo/data-sync.service'
import { saveProductImages, deleteProductImages } from './product-image.util'
import { detectCategoryFromQuery } from './product-search.util'
import { MembershipService } from '../membership/membership.service'

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductContact)
    private readonly contactRepo: Repository<ProductContact>,
    private readonly dataSync: DataSyncService,
    private readonly config: ConfigService,
    private readonly membershipService: MembershipService,
  ) {}

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

  /** [Admin UI] Edit any field of an existing listing. */
  async adminUpdate(id: string, dto: Partial<CreateProductDto> & { status?: string }) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    Object.assign(product, dto)
    const saved = await this.productRepo.save(product)
    this.mirror(saved)
    return saved
  }

  /** [Admin UI] Soft-delete a listing (status='deleted' — no deletedAt column on this entity). */
  async adminDelete(id: string) {
    return this.adminUpdate(id, { status: 'deleted' })
  }

  /** [Admin UI] Bulk approve/reject/delete for multi-selected rows. */
  async bulkAction(ids: string[], action: 'activate' | 'reject' | 'delete') {
    if (!ids.length) return { affected: 0 }
    const status = action === 'activate' ? 'active' : action === 'reject' ? 'rejected' : 'deleted'
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

  async findCategories() {
    const rows = await this.productRepo
      .createQueryBuilder('p')
      .select('DISTINCT p.category', 'category')
      .where('p.status = :status', { status: 'active' })
      .orderBy('p.category', 'ASC')
      .getRawMany()
    return rows.map((r) => r.category)
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
    }

    return { mobile: product.mobile, email: product.email, sellerId: product.sellerId }
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
}
