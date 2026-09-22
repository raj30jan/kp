import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/entities/user.entity'
import { Product } from '../marketplace/entities/product.entity'
import { District } from '../location/entities/district.entity'

/** Languages the UI currently ships (en + hi) — shown as the platform's language count. */
const SUPPORTED_LANGUAGES = 2

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(District) private readonly districtRepo: Repository<District>,
  ) {}

  /**
   * Public landing-page counters — all live DB numbers, no marketing placeholders.
   * farmers  = distinct sellers who have listed a product
   * buyers   = registered non-admin users (any member can buy)
   * products = active listings
   * districts= rows in the districts reference table
   * languages= UI languages the app ships
   */
  async publicStats() {
    const [farmers, buyers, products, districts] = await Promise.all([
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
    ])

    return { farmers, buyers, products, districts, languages: SUPPORTED_LANGUAGES }
  }
}
