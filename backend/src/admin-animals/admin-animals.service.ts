import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AnimalListing } from '../animals/entities/animal-listing.entity'
import { AnimalType } from '../animals/entities/animal-type.entity'
import { deleteProductImages } from '../marketplace/product-image.util'
import { deleteProductVideo } from '../marketplace/product-video.util'

const LISTING_DAYS = 30

const VALID_STATUSES = new Set(['pending', 'active', 'rejected', 'deleted'])

@Injectable()
export class AdminAnimalsService {
  constructor(
    @InjectRepository(AnimalListing) private readonly listingRepo: Repository<AnimalListing>,
    @InjectRepository(AnimalType) private readonly typeRepo: Repository<AnimalType>,
  ) {}

  /**
   * List animal listings for the approval queue.
   * `status` defaults to 'pending'; pass 'all' (or omit filter param use) to
   * get every non-deleted listing.
   */
  async list(status = 'pending', page = 1, limit = 20, q?: string) {
    if (status !== 'all' && !VALID_STATUSES.has(status)) {
      throw new BadRequestException('status must be pending | active | rejected | deleted | all')
    }
    const take = Math.min(Math.max(limit, 1), 60)
    const qb = this.listingRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.type', 'type')
      .leftJoinAndSelect('l.breed', 'breed')
      .leftJoinAndSelect('l.images', 'img')
      .orderBy('l.createdAt', 'DESC')

    if (status === 'all') {
      qb.where('l.status != :del', { del: 'deleted' })
    } else {
      qb.where('l.status = :status', { status })
    }

    if (q) {
      qb.andWhere('(l.title LIKE :q OR l.description LIKE :q OR l.mobile LIKE :q OR l.location LIKE :q OR breed.name LIKE :q OR type.name LIKE :q)', {
        q: `%${q}%`,
      })
    }

    qb.skip((Math.max(page, 1) - 1) * take).take(take)
    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit: take, pages: Math.ceil(total / take) }
  }

  /** Status counts for the admin dashboard badge. */
  async stats() {
    const rows = await this.listingRepo
      .createQueryBuilder('l')
      .select('l.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('l.status')
      .getRawMany<{ status: string; count: string }>()
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = Number(r.count)
      return acc
    }, {})
  }

  /** Approve — listing goes live for LISTING_DAYS. */
  async activate(id: string) {
    const listing = await this.mustFind(id)
    const now = new Date()
    listing.status = 'active'
    listing.activatedAt = now
    listing.expiresAt = new Date(now.getTime() + LISTING_DAYS * 24 * 60 * 60 * 1000)
    return this.listingRepo.save(listing)
  }

  /** Reject — stays hidden from the public list. */
  async reject(id: string) {
    const listing = await this.mustFind(id)
    listing.status = 'rejected'
    return this.listingRepo.save(listing)
  }

  /** Admin force-delete — soft delete + upload cleanup (seller not required). */
  async remove(id: string) {
    const listing = await this.mustFind(id)
    listing.status = 'deleted'
    await this.listingRepo.save(listing)

    const type = await this.typeRepo.findOne({ where: { id: listing.animalTypeId } })
    if (type) {
      deleteProductImages(`animals-${type.code}`, id)
      if (listing.videoUrl) deleteProductVideo(`animals-${type.code}`, id)
    }
    return { ok: true }
  }

  /** Bulk approve / reject / delete — returns affected count + per-row errors. */
  async bulkAction(ids: string[], action: 'activate' | 'reject' | 'delete') {
    if (!ids.length) return { affected: 0, errors: [] as string[] }
    if (!['activate', 'reject', 'delete'].includes(action)) {
      throw new BadRequestException('action must be activate | reject | delete')
    }
    let affected = 0
    const errors: string[] = []
    for (const id of ids) {
      try {
        if (action === 'activate') await this.activate(id)
        else if (action === 'reject') await this.reject(id)
        else await this.remove(id)
        affected++
      } catch (e: any) {
        errors.push(`${id}: ${e?.message || 'failed'}`)
      }
    }
    return { affected, errors }
  }

  private async mustFind(id: string) {
    const listing = await this.listingRepo.findOne({ where: { id } })
    if (!listing) throw new NotFoundException('Animal listing not found')
    return listing
  }
}
