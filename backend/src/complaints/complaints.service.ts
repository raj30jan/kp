import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Complaint } from './entities/complaint.entity'
import { CreateComplaintDto } from './dto/create-complaint.dto'
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto'
import { DataSyncService } from '../mongo/data-sync.service'

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint) private readonly repo: Repository<Complaint>,
    private readonly dataSync: DataSyncService,
  ) {}

  async create(dto: CreateComplaintDto, userId?: string) {
    const complaint = this.repo.create({
      ...dto,
      userId: userId || null,
      status: 'open',
    })
    const saved = await this.repo.save(complaint)
    this.dataSync
      .mirror({ entity: 'complaint', refId: saved.id, payload: saved as unknown as Record<string, any> })
      .catch(() => {})
    return { id: saved.id, status: saved.status, message: 'Complaint filed successfully' }
  }

  /** User sees only their own complaints. */
  async findByUser(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } })
  }

  /** Admin sees all complaints, optionally filtered by status. */
  async findAll(status?: string) {
    const where = status ? { status } : {}
    return this.repo.find({ where, order: { createdAt: 'DESC' } })
  }

  /** [Admin UI] Searchable/sortable/paginated complaint list. */
  async adminList(
    status?: string,
    q?: string,
    page = 1,
    limit = 20,
    sort: string = 'createdAt',
    dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const qb = this.repo.createQueryBuilder('c')
    if (status) qb.andWhere('c.status = :status', { status })
    if (q) qb.andWhere('(c.subject LIKE :q OR c.description LIKE :q OR c.contactEmail LIKE :q OR c.contactMobile LIKE :q)', { q: `%${q}%` })

    const sortable = ['createdAt', 'status', 'category', 'subject']
    const sortCol = sortable.includes(sort) ? sort : 'createdAt'
    qb.orderBy(`c.${sortCol}`, dir === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1, sort: sortCol, dir }
  }

  /** [Admin UI] Log a complaint on the caller's behalf (e.g. phoned-in complaint). */
  async adminCreate(dto: CreateComplaintDto & { userId?: string }) {
    return this.create(dto, dto.userId)
  }

  /** [Admin UI] Edit complaint details (subject/description/category/contact info). */
  async updateDetails(id: string, dto: Partial<CreateComplaintDto>) {
    const complaint = await this.findOne(id)
    Object.assign(complaint, dto)
    return this.repo.save(complaint)
  }

  /** [Admin UI] Hard-delete a complaint (no soft-delete column on this entity). */
  async remove(id: string) {
    await this.findOne(id)
    await this.repo.delete(id)
    return { success: true }
  }

  /** [Admin UI] Bulk-delete selected complaints. */
  async bulkRemove(ids: string[]) {
    if (!ids.length) return { affected: 0 }
    const result = await this.repo.delete(ids)
    return { affected: result.affected ?? 0 }
  }

  /** [Admin UI] Counts of complaints grouped by status, for dashboard KPIs. */
  async countsByStatus() {
    const rows = await this.repo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.status')
      .getRawMany()
    return rows.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {} as Record<string, number>)
  }

  async findOne(id: string) {
    const c = await this.repo.findOne({ where: { id } })
    if (!c) throw new NotFoundException('Complaint not found')
    return c
  }

  async updateStatus(id: string, dto: UpdateComplaintStatusDto, resolvedBy: string) {
    const complaint = await this.findOne(id)
    complaint.status = dto.status
    if (dto.status === 'resolved' || dto.status === 'rejected') {
      if (!dto.resolutionNote) {
        throw new BadRequestException('resolutionNote is required when resolving or rejecting a complaint')
      }
      complaint.resolutionNote = dto.resolutionNote
      complaint.resolvedBy = resolvedBy
      complaint.resolvedAt = new Date()
    }
    return this.repo.save(complaint)
  }
}
