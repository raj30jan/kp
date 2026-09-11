import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

/**
 * Generic mirror of every business record written to MySQL.
 *
 * Polyglot persistence rule (see SRS §3.5): every entry created in MySQL
 * is mirrored here in parallel so MongoDB always holds a queryable copy
 * for analytics, audit, and flexible reporting — while MySQL remains the
 * transactional source of truth.
 */
export type SyncedRecordDocument = HydratedDocument<SyncedRecord>

@Schema({ collection: 'synced_records', timestamps: true })
export class SyncedRecord {
  @Prop({ required: true, index: true })
  entity: string // logical entity name, e.g. 'service_interest', 'user'

  @Prop({ required: true, index: true })
  refId: string // primary key of the MySQL row (as string)

  @Prop({ type: Object, required: true })
  payload: Record<string, any> // full snapshot of the record

  @Prop({ index: true })
  sessionId?: string

  @Prop({ index: true })
  mobile?: string

  @Prop({ index: true })
  userId?: string
}

export const SyncedRecordSchema = SchemaFactory.createForClass(SyncedRecord)
