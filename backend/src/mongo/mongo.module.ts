import { DynamicModule, Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { ActivityLogService } from './activity-log.service'
import { ActivityLogController } from './activity-log.controller'
import { DataSyncService } from './data-sync.service'
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema'
import { SyncedRecord, SyncedRecordSchema } from './schemas/synced-record.schema'

/**
 * Global MongoDB module.
 *
 * Controlled by MONGO_ENABLED in .env:
 *  - true  -> connects to MONGO_URI and registers Mongoose models
 *  - false -> registers no-op services so the rest of the
 *             app (MySQL + Redis) keeps working without MongoDB
 */
@Global()
@Module({})
export class MongoModule {
  static register(): DynamicModule {
    const enabled = process.env.MONGO_ENABLED === 'true'

    if (!enabled) {
      return {
        module: MongoModule,
        providers: [ActivityLogService, DataSyncService],
        controllers: [ActivityLogController],
        exports: [ActivityLogService, DataSyncService],
      }
    }

    return {
      module: MongoModule,
      imports: [
        MongooseModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            uri: config.get<string>('MONGO_URI'),
          }),
        }),
        MongooseModule.forFeature([
          { name: ActivityLog.name, schema: ActivityLogSchema },
          { name: SyncedRecord.name, schema: SyncedRecordSchema },
        ]),
      ],
      providers: [ActivityLogService, DataSyncService],
      controllers: [ActivityLogController],
      exports: [ActivityLogService, DataSyncService],
    }
  }
}
