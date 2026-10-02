import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DataSyncService } from '../mongo/data-sync.service'
import { ExportInquiry } from './entities/export-inquiry.entity'
import { CreateExportInquiryDto, UpdateExportInquiryStatusDto } from './dto/export-inquiry.dto'

@Injectable()
export class ExportInquiryService {
  constructor(
    @InjectRepository(ExportInquiry)
    private readonly repo: Repository<ExportInquiry>,
    private readonly dataSync: DataSyncService,
  ) {}

  /**
   * Record an export/import enquiry. Works for guests (sessionId only) and
   * logged-in users (userId/mobile attached when known).
   *
   * Polyglot persistence: MySQL is the source of truth, then the entry is
   * mirrored to MongoDB + Redis (failures logged, never thrown).
   */
  async record(dto: CreateExportInquiryDto, meta: { userId?: string; ip?: string; userAgent?: string }) {
    const entry = this.repo.create({
      sessionId: dto.sessionId,
      direction: dto.direction.toUpperCase(),
      category: dto.category,
      product: dto.product,
      country: dto.country || null,
      state: dto.state || null,
      quantity: dto.quantity || null,
      quantityUnit: dto.quantityUnit || null,
      mobile: dto.mobile || null,
      notes: dto.notes || null,
      userId: meta.userId || null,
      ipAddress: meta.ip || null,
      userAgent: meta.userAgent || null,
      contactStatus: 'PENDING',
    })
    const saved = await this.repo.save(entry)

    await this.dataSync.mirror({
      entity: 'export_inquiry',
      refId: saved.id,
      payload: { ...saved },
      sessionId: saved.sessionId,
      mobile: saved.mobile || undefined,
      userId: saved.userId || undefined,
    })

    return { id: saved.id, message: 'Export/import inquiry recorded' }
  }

  /** Support team: list recent inquiries, optionally filtered by status/direction. */
  async list(status?: string, direction?: string, limit = 100) {
    const where: Record<string, string> = {}
    if (status) where.contactStatus = status.toUpperCase()
    if (direction) where.direction = direction.toUpperCase()
    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 500),
    })
  }

  /** [Admin UI] Searchable/sortable/paginated inquiry list, split by direction. */
  async adminList(
    status?: string,
    direction?: string,
    q?: string,
    page = 1,
    limit = 20,
    sort: string = 'createdAt',
    dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const qb = this.repo.createQueryBuilder('e')
    if (status) qb.andWhere('e.contactStatus = :status', { status: status.toUpperCase() })
    if (direction) qb.andWhere('e.direction = :direction', { direction: direction.toUpperCase() })
    if (q) {
      qb.andWhere('(e.product LIKE :q OR e.mobile LIKE :q OR e.country LIKE :q OR e.state LIKE :q OR e.category LIKE :q)', {
        q: `%${q}%`,
      })
    }

    const sortable = ['createdAt', 'contactStatus', 'product', 'direction', 'country']
    const sortCol = sortable.includes(sort) ? sort : 'createdAt'
    qb.orderBy(`e.${sortCol}`, dir === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1, sort: sortCol, dir }
  }

  /** [Admin UI] Hard-delete an inquiry (no soft-delete column on this entity). */
  async remove(id: number) {
    const entry = await this.repo.findOneBy({ id })
    if (!entry) throw new NotFoundException('Export/import inquiry not found')
    await this.repo.delete(id)
    return { success: true }
  }

  /** [Admin UI] Bulk-delete selected inquiries. */
  async bulkRemove(ids: number[]) {
    if (!ids.length) return { affected: 0 }
    const result = await this.repo.delete(ids)
    return { affected: result.affected ?? 0 }
  }

  /** Support team: mark an inquiry as contacted / guided / closed. */
  async updateStatus(id: number, dto: UpdateExportInquiryStatusDto, agentId?: string) {
    const entry = await this.repo.findOneBy({ id })
    if (!entry) throw new NotFoundException('Export/import inquiry not found')
    entry.contactStatus = dto.contactStatus.toUpperCase()
    if (dto.notes !== undefined) entry.notes = dto.notes
    if (agentId) entry.contactedBy = agentId
    entry.contactedAt = new Date()
    return this.repo.save(entry)
  }
}
