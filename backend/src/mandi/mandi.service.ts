import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * Proxies the data.gov.in AGMARKNET "Current Daily Price of Various
 * Commodities from Various Markets (Mandi)" dataset. The API key stays
 * server-side so it is never exposed to the browser bundle.
 *
 * Upstream record fields: state, district, market, commodity, variety,
 * grade, arrival_date, min_price, max_price, modal_price.
 */
export interface MandiQuery {
  state?: string
  district?: string
  market?: string
  commodity?: string
  /** Arrival date in DD/MM/YYYY (matches upstream Arrival_Date format). */
  date?: string
  limit?: number
  offset?: number
}

@Injectable()
export class MandiService {
  private readonly logger = new Logger(MandiService.name)
  private readonly baseUrl = 'https://api.data.gov.in/resource'

  // Short-lived in-memory cache keyed by the upstream query string. data.gov.in
  // rate-limits per API key (HTTP 429), so we cache each filter combination and
  // fall back to the last good response when the upstream throttles or errors.
  private readonly cache = new Map<string, { at: number; payload: any }>()
  private readonly cacheTtlMs = 10 * 60 * 1000 // 10 minutes

  constructor(private readonly config: ConfigService) {}

  async getRates(query: MandiQuery) {
    const apiKey = this.config.get<string>('MANDI_API_KEY')
    const resourceId =
      this.config.get<string>('MANDI_RESOURCE_ID') ||
      '35985678-0d79-46b4-9ed6-6f13308a1d24'

    if (!apiKey) {
      throw new ServiceUnavailableException('Mandi API key not configured')
    }

    // data.gov.in hard-caps `limit` at 10 records per request, so a usable
    // batch is assembled from several upstream pages (offset steps of 10).
    const batchSize = Math.min(Math.max(query.limit ?? 50, 10), 100)
    const startOffset = Math.max(query.offset ?? 0, 0)
    const pagesNeeded = Math.ceil(batchSize / 10)

    const cacheKey = JSON.stringify({ ...query, limit: batchSize, offset: startOffset })
    const hit = this.cache.get(cacheKey)
    if (hit && Date.now() - hit.at < this.cacheTtlMs) return hit.payload

    // Fetch upstream pages in bounded-parallel waves: fast enough to be usable
    // (~4 concurrent) but not a big burst that trips the per-key rate limit.
    const offsets = Array.from({ length: pagesNeeded }, (_, i) => startOffset + i * 10)
    const collected: { idx: number; records: any[] }[] = []
    let total = 0
    const CONCURRENCY = 4
    for (let i = 0; i < offsets.length; i += CONCURRENCY) {
      const chunk = offsets.slice(i, i + CONCURRENCY)
      const settled = await Promise.allSettled(
        chunk.map((off) => this.fetchPage(apiKey, resourceId, query, off)),
      )
      settled.forEach((r, j) => {
        if (r.status === 'fulfilled') {
          total = r.value.total
          collected.push({ idx: i + j, records: r.value.records })
        }
      })
      if (i + CONCURRENCY < offsets.length) {
        await new Promise((r) => setTimeout(r, 300))
      }
    }

    // Reassemble pages in offset order (parallel completion order isn't guaranteed).
    collected.sort((a, b) => a.idx - b.idx)
    const records = collected.flatMap((c) => c.records)

    if (records.length === 0) {
      if (hit) return hit.payload // nothing fresh → serve the last good batch
      throw new ServiceUnavailableException('Mandi data provider error')
    }

    const payload = { total, count: records.length, records }
    this.cache.set(cacheKey, { at: Date.now(), payload })
    return payload
  }

  /** Fetch one upstream page (≤10 records) and normalize to camelCase. */
  private async fetchPage(
    apiKey: string,
    resourceId: string,
    query: MandiQuery,
    offset: number,
  ): Promise<{ total: number; records: any[] }> {
    const params = new URLSearchParams({
      'api-key': apiKey,
      format: 'json',
      limit: '10', // upstream hard cap
      offset: String(offset),
      // Newest arrivals first — default upstream order is oldest (2006).
      'sort[Arrival_Date]': 'desc',
    })
    // data.gov.in filters use filters[<Field>]=<value> with the dataset's
    // PascalCase field names (State, District, Market, Commodity).
    if (query.state) params.set('filters[State]', query.state)
    if (query.district) params.set('filters[District]', query.district)
    if (query.market) params.set('filters[Market]', query.market)
    if (query.commodity) params.set('filters[Commodity]', query.commodity)
    if (query.date) params.set('filters[Arrival_Date]', query.date)

    const url = `${this.baseUrl}/${resourceId}?${params.toString()}`
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      // 15s guard so a slow upstream doesn't hang the request forever.
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      this.logger.warn(`data.gov.in responded ${res.status}`)
      throw new ServiceUnavailableException('Mandi data provider error')
    }
    const data = await res.json()
    const raw = Array.isArray(data?.records) ? data.records : []
    return {
      total: Number(data?.total ?? raw.length),
      // Normalize upstream PascalCase fields into a clean camelCase shape.
      records: raw.map((r: any) => ({
        state: r.State ?? null,
        district: r.District ?? null,
        market: r.Market ?? null,
        commodity: r.Commodity ?? null,
        variety: r.Variety ?? null,
        grade: r.Grade ?? null,
        arrivalDate: r.Arrival_Date ?? null,
        minPrice: r.Min_Price != null ? Number(r.Min_Price) : null,
        maxPrice: r.Max_Price != null ? Number(r.Max_Price) : null,
        modalPrice: r.Modal_Price != null ? Number(r.Modal_Price) : null,
        // AGMARKNET quotes all prices in ₹ per Quintal (no per-record unit field).
        unit: 'Quintal',
      })),
    }
  }
}
