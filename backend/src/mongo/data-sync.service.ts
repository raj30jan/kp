import { Injectable, Logger, Optional } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { RedisService } from '../redis/redis.service'
import { SyncedRecord } from './schemas/synced-record.schema'

/**
 * Polyglot persistence mirror — SRS §3.5.
 *
 * Every business entry lives in all three databases:
 *   MySQL  -> transactional source of truth (written by the owning service)
 *   MongoDB-> analytics/audit copy (synced_records collection)
 *   Redis  -> hot cache: latest snapshot per record + recent-entries list
 *
 * Call `mirror()` right after the MySQL save. Mongo + Redis writes run in
 * PARALLEL via Promise.allSettled — a failure in either is logged but never
 * breaks the request (MySQL is already committed).
 */
@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name)

  constructor(
    private readonly redis: RedisService,
    @Optional()
    @InjectModel(SyncedRecord.name)
    private readonly model?: Model<SyncedRecord>,
  ) {}

  /**
   * Mirror a freshly-written MySQL row into MongoDB and Redis in parallel.
   * Await the returned promise when the caller must guarantee all three
   * stores reflect the entry before responding.
   */
  async mirror(record: {
    entity: string
    refId: string | number
    payload: Record<string, any>
    sessionId?: string
    mobile?: string
    userId?: string
    cacheTtlSeconds?: number
  }): Promise<void> {
    const refId = String(record.refId)
    const key = `record:${record.entity}:${refId}`

    const jobs: Promise<unknown>[] = [
      // Redis — latest snapshot + push onto recent list (cap 200)
      this.redis
        .set(key, JSON.stringify(record.payload), record.cacheTtlSeconds ?? 86400)
        .then(() => this.redis.lpushTrim(`recent:${record.entity}`, refId, 200)),
    ]

    // Mongo — full copy for analytics/audit (no-op when MONGO_ENABLED=false)
    if (this.model) {
      jobs.push(
        this.model.create({
          entity: record.entity,
          refId,
          payload: record.payload,
          sessionId: record.sessionId,
          mobile: record.mobile,
          userId: record.userId,
        }),
      )
    }

    const results = await Promise.allSettled(jobs)
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const target = i === 0 ? 'Redis' : 'MongoDB'
        this.logger.warn(`${target} mirror failed for ${record.entity}#${refId}: ${r.reason?.message}`)
      }
    })
  }
}
