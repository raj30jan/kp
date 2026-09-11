import { Injectable, Logger, Optional } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ActivityLog } from './schemas/activity-log.schema'

/**
 * Fire-and-forget activity logging into MongoDB.
 * If Mongo is disabled (MONGO_ENABLED=false), the model is absent and
 * logging becomes a no-op — the app keeps working with MySQL + Redis only.
 */
@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name)

  constructor(
    @Optional()
    @InjectModel(ActivityLog.name)
    private readonly model?: Model<ActivityLog>,
  ) {}

  log(entry: {
    action: string
    userId?: string
    mobile?: string
    meta?: Record<string, any>
    ip?: string
    userAgent?: string
  }): void {
    if (!this.model) return // Mongo disabled — skip silently
    this.model
      .create(entry)
      .catch((err) => this.logger.warn(`activity log failed: ${err.message}`))
  }
}
