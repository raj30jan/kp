import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ProductService } from './product.service'

/**
 * Runs hourly: any `active` listing whose `expiresAt` has passed (15 days
 * after admin activation, by default) is flipped to `expired`. The seller
 * must then call POST /marketplace/products/:id/reactivate to go live again.
 */
@Injectable()
export class ProductExpiryCron {
  private readonly logger = new Logger(ProductExpiryCron.name)

  constructor(private readonly productService: ProductService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiry() {
    const count = await this.productService.expireOverdue()
    if (count > 0) {
      this.logger.log(`Auto-expired ${count} product listing(s) past their 15-day window`)
    }
  }
}
