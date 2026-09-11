import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

/**
 * MongoDB is used for high-volume, flexible-shape data that doesn't
 * belong in normalized MySQL tables. First use case: activity logs.
 *
 * Every auth event (otp sent, otp verified, register, login, logout)
 * is recorded here for analytics and security auditing.
 */
export type ActivityLogDocument = HydratedDocument<ActivityLog>

@Schema({ collection: 'activity_logs', timestamps: true })
export class ActivityLog {
  @Prop({ required: true, index: true })
  action: string // e.g. 'otp.send', 'auth.register', 'auth.login'

  @Prop({ index: true })
  userId?: string // MySQL users.id (UUID) when known

  @Prop({ index: true })
  mobile?: string

  @Prop({ type: Object })
  meta?: Record<string, any> // free-form: ip, userAgent, request context

  @Prop()
  ip?: string

  @Prop()
  userAgent?: string
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog)
