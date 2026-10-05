import Redis from 'ioredis'
import { DataSource } from 'typeorm'

/**
 * Minimal key-value contract used by RedisService.
 * Two backends:
 *   - IoredisKvStore  → real Redis (local dev / Memorystore)
 *   - MysqlKvStore    → `kv_store` table in MySQL (Cloud Run without Redis)
 */
export interface KvStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  lpushTrim(key: string, value: string, maxLen: number): Promise<void>
  lrange(key: string, start: number, stop: number): Promise<string[]>
}

export class IoredisKvStore implements KvStore {
  constructor(private readonly client: Redis) {}

  get(key: string) {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string) {
    await this.client.del(key)
  }

  async exists(key: string) {
    return (await this.client.exists(key)) === 1
  }

  async lpushTrim(key: string, value: string, maxLen: number) {
    await this.client.multi().lpush(key, value).ltrim(key, 0, maxLen - 1).exec()
  }

  lrange(key: string, start: number, stop: number) {
    return this.client.lrange(key, start, stop)
  }
}

/**
 * MySQL fallback. Expiry is enforced on read (lazy) plus an opportunistic
 * sweep on ~1% of writes. Lists are stored as a JSON array in `v`.
 */
export class MysqlKvStore implements KvStore {
  private ready: Promise<void>

  constructor(private readonly ds: DataSource) {
    this.ready = this.ds.query(`
      CREATE TABLE IF NOT EXISTS kv_store (
        k VARCHAR(191) NOT NULL PRIMARY KEY,
        v MEDIUMTEXT NOT NULL,
        expires_at DATETIME(3) NULL,
        INDEX idx_kv_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
  }

  private async sweep() {
    if (Math.random() < 0.01) {
      await this.ds.query(`DELETE FROM kv_store WHERE expires_at IS NOT NULL AND expires_at < NOW(3)`)
    }
  }

  async get(key: string) {
    await this.ready
    const rows: { v: string }[] = await this.ds.query(
      `SELECT v FROM kv_store WHERE k = ? AND (expires_at IS NULL OR expires_at > NOW(3)) LIMIT 1`,
      [key],
    )
    return rows.length ? rows[0].v : null
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    await this.ready
    const exp = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null
    await this.ds.query(
      `INSERT INTO kv_store (k, v, expires_at) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE v = VALUES(v), expires_at = VALUES(expires_at)`,
      [key, value, exp],
    )
    await this.sweep()
  }

  async del(key: string) {
    await this.ready
    await this.ds.query(`DELETE FROM kv_store WHERE k = ?`, [key])
  }

  async exists(key: string) {
    return (await this.get(key)) !== null
  }

  async lpushTrim(key: string, value: string, maxLen: number) {
    const list = await this.lrange(key, 0, -1)
    list.unshift(value)
    await this.set(key, JSON.stringify(list.slice(0, maxLen)))
  }

  async lrange(key: string, start: number, stop: number) {
    const raw = await this.get(key)
    if (!raw) return []
    let list: string[]
    try {
      list = JSON.parse(raw)
    } catch {
      return []
    }
    const end = stop < 0 ? list.length + stop + 1 : stop + 1
    return list.slice(start, end)
  }
}
