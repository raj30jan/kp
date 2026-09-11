import { Inject, Injectable } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_CLIENT } from './redis.constants'

/**
 * Thin wrapper around ioredis with the operations we need.
 * Keys used by the Auth module:
 *   otp:<mobile>           -> the 6-digit OTP           (TTL 5 min)
 *   otp-verified:<mobile>  -> "1" once OTP verified     (TTL 10 min)
 *   captcha:<id>           -> the expected answer       (TTL 5 min)
 *   blacklist:<token>      -> "1" for logged-out tokens (TTL = token expiry)
 */
@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1
  }

  /** Push a value onto the head of a list and trim it to `maxLen` entries. */
  async lpushTrim(key: string, value: string, maxLen = 200): Promise<void> {
    await this.client.multi().lpush(key, value).ltrim(key, 0, maxLen - 1).exec()
  }

  /** Read a list range (default: first 100 entries). */
  async lrange(key: string, start = 0, stop = 99): Promise<string[]> {
    return this.client.lrange(key, start, stop)
  }
}
