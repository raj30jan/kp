import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/entities/user.entity'
import { Product } from '../marketplace/entities/product.entity'
import { District } from '../location/entities/district.entity'
import { SiteVisit } from './entities/site-visit.entity'

/** Languages the UI currently ships (en + hi) — shown as the platform's language count. */
const SUPPORTED_LANGUAGES = 2

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(District) private readonly districtRepo: Repository<District>,
    @InjectRepository(SiteVisit) private readonly visitRepo: Repository<SiteVisit>,
  ) {}

  /**
   * Public landing-page counters — all live DB numbers, no marketing placeholders.
   * farmers  = distinct sellers who have listed a product
   * buyers   = registered non-admin users (any member can buy)
   * products = active listings
   * districts= rows in the districts reference table
   * languages= UI languages the app ships
   * visitors = unique browser sessions that have visited the site
   */
  async publicStats() {
    const [farmers, buyers, products, districts, visitors] = await Promise.all([
      this.productRepo
        .createQueryBuilder('p')
        .select('COUNT(DISTINCT p.seller_id)', 'c')
        .where('p.seller_id IS NOT NULL')
        .getRawOne()
        .then((r) => Number(r?.c || 0)),
      this.userRepo
        .createQueryBuilder('u')
        .where('u.role NOT IN (:...roles)', { roles: ['admin', 'super_admin'] })
        .getCount(),
      this.productRepo.count({ where: { status: 'active' } }),
      this.districtRepo.count(),
      this.visitRepo.count(),
    ])

    return { farmers, buyers, products, districts, visitors, languages: SUPPORTED_LANGUAGES }
  }

  /**
   * Count a visitor once per browser session. INSERT IGNORE makes the
   * unique session_id index do the dedupe — safe to call on every page load.
   */
  async recordVisit(sessionId: string, meta: { ip?: string; userAgent?: string }) {
    if (!sessionId || sessionId.length > 64) return { counted: false }
    try {
      await this.visitRepo.insert({
        sessionId,
        ipAddress: meta.ip || null,
        userAgent: meta.userAgent || null,
      })
      return { counted: true }
    } catch (e: any) {
      // ER_DUP_ENTRY — this session was already counted; not an error.
      if (e?.errno === 1062 || e?.code === 'ER_DUP_ENTRY') return { counted: false }
      throw e
    }
  }
}
