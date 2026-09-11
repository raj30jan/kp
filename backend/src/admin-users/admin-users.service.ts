import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { StatusMaster } from '../common/entities/status-master.entity'
import { User } from '../users/entities/user.entity'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

const SORTABLE_COLUMNS = ['displayName', 'email', 'mobile', 'role', 'isActive', 'createdAt'] as const

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(StatusMaster) private readonly statusRepo: Repository<StatusMaster>,
  ) {}

  async findAll(
    role?: string,
    page = 1,
    limit = 20,
    q?: string,
    sort: string = 'createdAt',
    dir: 'ASC' | 'DESC' = 'DESC',
  ) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .select([
        'u.id', 'u.email', 'u.mobile', 'u.displayName', 'u.role',
        'u.isActive', 'u.isVerified', 'u.freeListingsUsed', 'u.freeContactsUsed',
        'u.createdAt',
      ])
      .where('u.deletedAt IS NULL')

    if (role) qb.andWhere('u.role = :role', { role })
    if (q) {
      qb.andWhere('(u.displayName LIKE :q OR u.email LIKE :q OR u.mobile LIKE :q)', { q: `%${q}%` })
    }

    const sortCol = (SORTABLE_COLUMNS as readonly string[]).includes(sort) ? sort : 'createdAt'
    qb.orderBy(`u.${sortCol}`, dir === 'ASC' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const [users, total] = await qb.getManyAndCount()
    return { users, total, page, limit, pages: Math.ceil(total / limit) || 1, sort: sortCol, dir }
  }

  /** [Admin UI] Create a brand-new user account directly from the admin panel. */
  async create(dto: CreateUserDto) {
    if (!dto.email && !dto.mobile) {
      throw new BadRequestException('Provide at least an email or a mobile number')
    }
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email || undefined }, { mobile: dto.mobile || undefined }],
    })
    if (existing) throw new ConflictException('A user with this email or mobile already exists')

    const activeStatus = await this.statusRepo.findOneByOrFail({ entityType: 'user', code: 'active' })
    const user = this.userRepo.create({
      email: dto.email || null,
      mobile: dto.mobile || null,
      displayName: dto.displayName || null,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role || 'user',
      statusId: activeStatus.id,
      isVerified: 1,
      isActive: 1,
    })
    return this.userRepo.save(user)
  }

  /** [Admin UI] Soft-delete a user (keeps the row for audit, hides it everywhere). */
  async remove(id: string) {
    const user = await this.findOne(id)
    await this.userRepo.softDelete(id)
    return user
  }

  /** [Admin UI] Bulk activate/deactivate/delete for multi-selected rows. */
  async bulkAction(ids: string[], action: 'activate' | 'deactivate' | 'delete') {
    if (!ids.length) return { affected: 0 }
    if (action === 'delete') {
      const result = await this.userRepo.softDelete(ids)
      return { affected: result.affected ?? 0 }
    }
    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ isActive: action === 'activate' ? 1 : 0 })
      .where('id IN (:...ids)', { ids })
      .execute()
    return { affected: result.affected ?? 0 }
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id)
    if (dto.role !== undefined) user.role = dto.role
    if (dto.displayName !== undefined) user.displayName = dto.displayName
    if (dto.isActive !== undefined) user.isActive = dto.isActive
    return this.userRepo.save(user)
  }

  /** Super-admin promotes a user to admin role. */
  async promoteToAdmin(id: string) {
    return this.update(id, { role: 'admin' })
  }

  /** Super-admin demotes an admin back to regular user. */
  async demoteToUser(id: string) {
    return this.update(id, { role: 'user' })
  }

  async getStats() {
    const total = await this.userRepo.count({ where: { deletedAt: undefined as any } })
    const byRole = await this.userRepo
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .where('u.deleted_at IS NULL')
      .groupBy('u.role')
      .getRawMany()

    const activeMemberships = 0 // TODO: join membership_subscriptions once wired

    return {
      totalUsers: total,
      byRole: byRole.reduce((acc, r) => ({ ...acc, [r.role]: Number(r.count) }), {}),
      activeMemberships,
    }
  }
}
