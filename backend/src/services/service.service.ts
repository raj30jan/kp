import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ServiceProvider } from './entities/service-provider.entity'
import { CreateServiceDto, ListServicesDto, UpdateServiceDto } from './dto/service.dto'
import { saveProductImages, deleteProductImages } from '../marketplace/product-image.util'
import { DataSyncService } from '../mongo/data-sync.service'

const LISTING_DAYS = 30 // same listing window as products

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(ServiceProvider) private readonly repo: Repository<ServiceProvider>,
    private readonly dataSync: DataSyncService,
  ) {}

  private mirror(svc: ServiceProvider) {
    this.dataSync
      .mirror({ entity: 'service_provider', refId: svc.id, payload: svc as unknown as Record<string, any> })
      .catch(() => {})
  }

  /** Seller submits a service listing — always starts pending admin approval. */
  async create(dto: CreateServiceDto, providerId: string, files?: Array<{ buffer: Buffer; originalname: string }>) {
    const svc = this.repo.create({
      providerId,
      serviceType: dto.serviceType,
      title: dto.title,
      titleHi: dto.titleHi || null,
      description: dto.description || null,
      rate: dto.rate ?? null,
      rateUnit: dto.rateUnit,
      mobile: dto.mobile,
      village: dto.village || null,
      tehsil: dto.tehsil || null,
      district: dto.district || null,
      state: dto.state || null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      status: 'pending',
    })
    const saved = await this.repo.save(svc)

    if (files?.length) {
      try {
        saved.imageUrls = await saveProductImages(`services_${dto.serviceType}`, saved.id, files)
        await this.repo.save(saved)
      } catch (e) {
        deleteProductImages(`services_${dto.serviceType}`, saved.id)
        await this.repo.delete(saved.id)
        throw e
      }
    }
    this.mirror(saved)
    return saved
  }

  /** Public browse — active listings only, newest first. */
  async list(query: ListServicesDto, providerId?: string) {
    const page = Math.max(parseInt(query.page || '1', 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(query.limit || '12', 10) || 12, 1), 50)

    const qb = this.repo.createQueryBuilder('s')
    if (providerId) {
      qb.where('s.providerId = :providerId', { providerId })
    } else {
      qb.where("s.status = 'active'")
    }
    if (query.type) qb.andWhere('s.serviceType = :type', { type: query.type })
    if (query.state) qb.andWhere('s.state = :state', { state: query.state })
    if (query.district) qb.andWhere('s.district = :district', { district: query.district })
    if (query.q) {
      qb.andWhere('(s.title LIKE :q OR s.description LIKE :q OR s.village LIKE :q)', { q: `%${query.q}%` })
    }
    qb.orderBy('s.createdAt', 'DESC').skip((page - 1) * limit).take(limit)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findById(id: string) {
    const svc = await this.repo.findOne({ where: { id } })
    if (!svc) throw new NotFoundException('Service not found')
    await this.repo.increment({ id }, 'views', 1)
    return svc
  }

  /** Seller edits their own listing — pulls it back to pending for re-approval. */
  async updateBySeller(id: string, providerId: string, dto: UpdateServiceDto) {
    const svc = await this.repo.findOne({ where: { id } })
    if (!svc) throw new NotFoundException('Service not found')
    if (svc.providerId !== providerId) throw new ForbiddenException('Not your listing')

    const { title, ...rest } = dto as any // title is immutable after creation
    Object.assign(svc, rest)
    // Admin-only verification: any edit pulls the listing offline until re-approved.
    if (svc.status === 'active' || svc.status === 'expired') {
      svc.status = 'pending'
      svc.activatedAt = null
      svc.expiresAt = null
    }
    const saved = await this.repo.save(svc)
    this.mirror(saved)
    return saved
  }

  async remove(id: string, providerId: string) {
    const svc = await this.repo.findOne({ where: { id } })
    if (!svc) throw new NotFoundException('Service not found')
    if (svc.providerId !== providerId) throw new ForbiddenException('Not your listing')
    try { deleteProductImages(`services_${svc.serviceType}`, svc.id) } catch {}
    await this.repo.delete(id)
    return { deleted: true }
  }

  /** Seller reactivates an expired listing — goes back to pending, not live. */
  async reactivate(id: string, providerId: string) {
    const svc = await this.repo.findOne({ where: { id } })
    if (!svc) throw new NotFoundException('Service not found')
    if (svc.providerId !== providerId) throw new ForbiddenException('Not your listing')
    if (svc.status !== 'expired') {
      throw new BadRequestException('Only expired listings can be reactivated')
    }
    svc.status = 'pending'
    svc.activatedAt = null
    svc.expiresAt = null
    const saved = await this.repo.save(svc)
    this.mirror(saved)
    return saved
  }

  // ---------- Admin ----------

  async listPending() {
    return this.repo.find({ where: { status: 'pending' }, order: { createdAt: 'ASC' } })
  }

  async adminList(status?: string, page = 1, limit = 20, q?: string) {
    const qb = this.repo.createQueryBuilder('s')
    if (status) qb.where('s.status = :status', { status })
    if (q) qb.andWhere('(s.title LIKE :q OR s.mobile LIKE :q OR s.village LIKE :q)', { q: `%${q}%` })
    qb.orderBy('s.createdAt', 'DESC').skip((page - 1) * limit).take(limit)
    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async adminFindOne(id: string) {
    const svc = await this.repo.findOne({ where: { id } })
    if (!svc) throw new NotFoundException('Service not found')
    return svc
  }

  async activate(id: string) {
    const svc = await this.repo.findOne({ where: { id } })
    if (!svc) throw new NotFoundException('Service not found')
    if (svc.status !== 'pending') throw new BadRequestException('Only pending listings can be approved')
    const now = new Date()
    svc.status = 'active'
    svc.activatedAt = now
    svc.expiresAt = new Date(now.getTime() + LISTING_DAYS * 24 * 60 * 60 * 1000)
    const saved = await this.repo.save(svc)
    this.mirror(saved)
    return saved
  }

  async reject(id: string) {
    const svc = await this.repo.findOne({ where: { id } })
    if (!svc) throw new NotFoundException('Service not found')
    if (svc.status !== 'pending') throw new BadRequestException('Only pending listings can be rejected')
    svc.status = 'rejected'
    const saved = await this.repo.save(svc)
    this.mirror(saved)
    return saved
  }

  async adminDelete(id: string) {
    const svc = await this.repo.findOne({ where: { id } })
    if (!svc) throw new NotFoundException('Service not found')
    try { deleteProductImages(`services_${svc.serviceType}`, svc.id) } catch {}
    await this.repo.delete(id)
    return { deleted: true }
  }

  /** Distinct service types present in active listings (filter chips). */
  async findTypes() {
    const rows = await this.repo
      .createQueryBuilder('s')
      .select('DISTINCT s.serviceType', 'type')
      .where("s.status = 'active'")
      .getRawMany()
    return rows.map((r) => r.type)
  }
}
