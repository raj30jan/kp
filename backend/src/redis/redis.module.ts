import { Global, Logger, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { DataSource } from 'typeorm'
import { IoredisKvStore, KvStore, MysqlKvStore } from './kv-store'
import { REDIS_CLIENT } from './redis.constants'
import { RedisService } from './redis.service'

/**
 * Global Redis module. Any service can inject RedisService
 * without importing this module again.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService, DataSource],
      useFactory: (config: ConfigService, ds: DataSource): KvStore => {
        const host = config.get<string>('REDIS_HOST')
        if (!host) {
          Logger.log('REDIS_HOST not set — using MySQL kv_store table', 'RedisModule')
          return new MysqlKvStore(ds)
        }
        return new IoredisKvStore(
          new Redis({
            host,
            port: config.get<number>('REDIS_PORT'),
            password: config.get<string>('REDIS_PASSWORD') || undefined,
          }),
        )
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
