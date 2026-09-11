import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DataSyncService } from '../mongo/data-sync.service'
import { ServiceInterest } from './entities/service-interest.entity'
import { CreateServiceInterestDto, UpdateContactStatusDto } from './dto/service-interest.dto'

@Injectable()
export class ServiceInterestService {
  constructor(
    @InjectRepository(ServiceInterest)
    private readonly repo: Repository<ServiceInterest>,
    private readonly dataSync: DataSyncService,
  ) {}

  /**
   * Record a service selection. Works for guests (sessionId only) and
   * logged-in users (userId/mobile attached when known).
   *
   * Polyglot persistence (SRS §3.5): the MySQL row is the source of truth,
   * then the entry is mirrored to MongoDB + Redis in parallel so all three
   * databases reflect it before we respond.
   */
  async record(dto: CreateServiceInterestDto, meta: { userId?: string; ip?: string; userAgent?: string }) {
    const entry = this.repo.create({
      sessionId: dto.sessionId,
      serviceCode: dto.serviceCode,
      serviceName: dto.serviceName,
      sourcePage: dto.sourcePage || 'home',
      mobile: dto.mobile || null,
      userId: meta.userId || null,
      ipAddress: meta.ip || null,
      userAgent: meta.userAgent || null,
      contactStatus: 'PENDING',
    })
    const saved = await this.repo.save(entry)

    // Mirror to MongoDB + Redis in parallel (failures logged, never thrown)
    await this.dataSync.mirror({
      entity: 'service_interest',
      refId: saved.id,
      payload: { ...saved },
      sessionId: saved.sessionId,
      mobile: saved.mobile || undefined,
      userId: saved.userId || undefined,
    })

    return { id: saved.id, message: 'Service interest recorded' }
  }

  /** Support team: list recent service interests, optionally filtered by status. */
  async list(status?: string, limit = 100) {
    const where = status ? { contactStatus: status.toUpperCase() } : {}
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 500),
    })
  }

  /** [Admin UI] Searchable/sortable/paginated lead list. */
  async adminList(
    status?: string,
    q?: string,
    page = 1,
    limit = 20,
    sort: string = 'createdAt',
    dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const qb = this.repo.createQueryBuilder('s')
    if (status) qb.andWhere('s.contactStatus = :status', { status: status.toUpperCase() })
    if (q) qb.andWhere('(s.serviceName LIKE :q OR s.mobile LIKE :q OR s.sourcePage LIKE :q)', { q: `%${q}%` })

    const sortable = ['createdAt', 'contactStatus', 'serviceName']
    const sortCol = sortable.includes(sort) ? sort : 'createdAt'
    qb.orderBy(`s.${sortCol}`, dir === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1, sort: sortCol, dir }
  }

  async findOne(id: number) {
    const entry = await this.repo.findOneBy({ id })
    if (!entry) throw new NotFoundException('Service interest not found')
    return entry
  }

  /** [Admin UI] Log a lead manually (e.g. a walk-in / phone enquiry). */
  async adminCreate(dto: CreateServiceInterestDto & { mobile?: string }) {
    return this.record({ ...dto, sourcePage: dto.sourcePage || 'admin_manual' }, {})
  }

  /** [Admin UI] Hard-delete a lead (no soft-delete column on this entity). */
  async remove(id: number) {
    await this.findOne(id)
    await this.repo.delete(id)
    return { success: true }
  }

  /** [Admin UI] Bulk-delete selected leads. */
  async bulkRemove(ids: number[]) {
    if (!ids.length) return { affected: 0 }
    const result = await this.repo.delete(ids)
    return { affected: result.affected ?? 0 }
  }

  /** Support team: mark a lead as contacted / guided / closed. */
  async updateStatus(id: number, dto: UpdateContactStatusDto, agentId?: string) {
    const entry = await this.repo.findOneBy({ id })
    if (!entry) throw new NotFoundException('Service interest not found')
    entry.contactStatus = dto.contactStatus.toUpperCase()
    if (dto.notes !== undefined) entry.notes = dto.notes
    if (agentId) entry.contactedBy = agentId
    entry.contactedAt = new Date()
    return this.repo.save(entry)
  }
}
