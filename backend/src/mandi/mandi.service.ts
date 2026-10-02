import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

/**
 * Proxies the AGMARKNET "Market-wise, Commodity-wise Daily Price & Arrival"
 * report — the same mandi dataset data.gov.in republishes, but served from
 * agmarknet.gov.in's own API (the same one its public site calls).
 *
 * Why not data.gov.in directly: api.data.gov.in's WAF refuses connections
 * from some networks outright, while api.agmarknet.gov.in stays reachable —
 * and this API needs no key or captcha for the daily report endpoint.
 *
 * Flow: GET /v1/daily-price-arrival/filters returns the full dimension map
 * (states, districts, markets, commodities — 4k+ markets in one call), cached
 * for a day. Names in the query are resolved to numeric ids, then
 * POST /v1/prices-and-arrivals/market-report/daily returns
 * states[].markets[].commodities[].data[] rows for one date.
 */
export interface MandiQuery {
  state?: string
  district?: string
  market?: string
  commodity?: string
  /** Arrival date in DD/MM/YYYY or YYYY-MM-DD. */
  date?: string
  limit?: number
  offset?: number
}

interface AgmDimensions {
  states: { id: number; name: string }[]
  districts: Map<number, { name: string; stateId: number }>
  markets: { id: number; name: string; stateId: number; districtId: number | null }[]
  /** market id → district name (resolved once, used per report row). */
  marketDistrict: Map<number, string | null>
}

@Injectable()
export class MandiService {
  private readonly logger = new Logger(MandiService.name)
  private readonly baseUrl = 'https://api.agmarknet.gov.in/v1'

  // The agmarknet WAF 403s non-browser clients — Node fetch's default
  // `User-Agent: node` is refused, so we present the same headers the
  // agmarknet.gov.in web app itself sends.
  private readonly upstreamHeaders = {
    accept: 'application/json',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    origin: 'https://agmarknet.gov.in',
    referer: 'https://agmarknet.gov.in/',
  }

  // Short-lived in-memory cache keyed by the upstream query string, so repeat
  // page loads don't re-hit the report endpoint; the last good response is
  // served (marked stale) when the upstream is down.
  private readonly cache = new Map<string, { at: number; payload: any }>()
  private readonly cacheTtlMs = 10 * 60 * 1000 // 10 minutes

  // Disk-backed fallback: the in-memory cache dies with the process, so
  // last-good snapshots persist on disk and are served (marked stale) when
  // the upstream is unreachable after a cold start.
  private readonly diskFile = join(process.cwd(), 'data', 'mandi-cache.json')
  private readonly disk = new Map<string, { at: number; payload: any }>()
  private diskDirty = false
  private diskTimer?: NodeJS.Timeout

  // Dimension map (state/district/market id lookups) — static upstream data,
  // cached for a day and populated lazily by loadDimensions().
  private dims?: { at: number; data: AgmDimensions }
  private dimsPromise?: Promise<AgmDimensions | null>
  private readonly dimsTtlMs = 24 * 60 * 60 * 1000

  constructor() {
    try {
      if (existsSync(this.diskFile)) {
        const raw = JSON.parse(readFileSync(this.diskFile, 'utf8'))
        for (const [k, v] of Object.entries(raw)) {
          this.disk.set(k, v as { at: number; payload: any })
        }
        this.logger.log(`Mandi disk cache loaded (${this.disk.size} snapshots)`)
      }
    } catch {
      this.logger.warn('Could not read mandi disk cache — starting empty')
    }
  }

  async getRates(query: MandiQuery) {
    const batchSize = Math.min(Math.max(query.limit ?? 50, 10), 100)
    const startOffset = Math.max(query.offset ?? 0, 0)

    const cacheKey = JSON.stringify({ ...query, limit: batchSize, offset: startOffset })
    const hit = this.cache.get(cacheKey)
    if (hit && Date.now() - hit.at < this.cacheTtlMs) return hit.payload

    const dims = await this.loadDimensions()
    const result = dims
      ? await this.collectRecords(dims, query, startOffset + batchSize)
      : null
    const records = result?.page ?? []

    // Resolved query with genuinely no data → empty payload, not an error.
    if (result && records.length === 0) {
      return { total: 0, count: 0, records: [] }
    }

    if (records.length === 0) {
      // Nothing fresh — serve the last good batch (memory first, then disk).
      if (hit) return { ...hit.payload, stale: true }
      const snap = this.disk.get(cacheKey)
      if (snap) {
        this.logger.warn(`Upstream unreachable — serving disk snapshot for ${cacheKey}`)
        return { ...snap.payload, stale: true }
      }
      throw new ServiceUnavailableException('Mandi data provider error')
    }

    const payload = { total: result!.total, count: records.length, records }
    this.cache.set(cacheKey, { at: Date.now(), payload })
    this.persist(cacheKey, payload)
    return payload
  }

  /**
   * Resolve the query scope, walk back through recent dates until data is
   * found (upstream lags ~1 day — today's report is usually empty), then
   * apply name filters and slice the batch.
   */
  private async collectRecords(
    dims: AgmDimensions,
    query: MandiQuery,
    needed: number,
  ): Promise<{ total: number; page: any[] } | null> {
    const dates = query.date
      ? ([this.parseDate(query.date)].filter(Boolean) as Date[])
      : Array.from({ length: 4 }, (_, i) => new Date(Date.now() - i * 86400000))
    if (dates.length === 0) return { total: 0, page: [] }

    const commodityNeedle = this.norm(query.commodity || '')
    const districtNeedle = this.norm(query.district || '')

    // A named mandi that doesn't resolve to any upstream market id means
    // 'no data' — an empty result, not a provider failure.
    if (query.market) {
      const s = query.state ? this.findState(dims, query.state) : undefined
      if (this.findMarkets(dims, query.market, s).length === 0) {
        return { total: 0, page: [] }
      }
    }

    for (const date of dates) {
      const rows = await this.fetchScope(dims, query, this.toIso(date), needed)
      if (rows.length === 0) continue

      const filtered = rows.filter(
        (r) =>
          (!commodityNeedle || this.norm(r.commodity || '').includes(commodityNeedle)) &&
          (!districtNeedle || this.norm(r.district || '').includes(districtNeedle)),
      )
      if (filtered.length === 0) continue
      return { total: filtered.length, page: filtered.slice(Math.max(query.offset ?? 0, 0)) }
    }
    return null
  }

  /**
   * Fetch the daily report for the resolved scope. A specific market is one
   * call; a state is one call with all its market ids; 'All India' iterates
   * states in small parallel waves and stops once enough rows are collected.
   */
  private async fetchScope(
    dims: AgmDimensions,
    query: MandiQuery,
    isoDate: string,
    needed: number,
  ): Promise<any[]> {
    const state = query.state ? this.findState(dims, query.state) : undefined
    const markets = query.market ? this.findMarkets(dims, query.market, state) : undefined

    if (markets && markets.length === 0) return [] // named mandi doesn't exist

    const scopes: { stateIds: number[]; marketIds: number[] }[] = []
    if (markets) {
      scopes.push({
        stateIds: [...new Set(markets.map((m) => m.stateId))],
        marketIds: markets.map((m) => m.id),
      })
    } else if (state) {
      scopes.push({
        stateIds: [state.id],
        marketIds: dims.markets.filter((m) => m.stateId === state.id).map((m) => m.id),
      })
    } else {
      for (const s of dims.states) {
        const ids = dims.markets.filter((m) => m.stateId === s.id).map((m) => m.id)
        if (ids.length) scopes.push({ stateIds: [s.id], marketIds: ids })
      }
    }

    const rows: any[] = []
    const CONCURRENCY = 4
    for (let i = 0; i < scopes.length; i += CONCURRENCY) {
      const settled = await Promise.allSettled(
        scopes.slice(i, i + CONCURRENCY).map((sc) => this.fetchReport(isoDate, sc)),
      )
      for (const r of settled) if (r.status === 'fulfilled') rows.push(...r.value)
      // 'All India' spans ~36 state calls — stop once the batch is filled
      // instead of always paying the full cost.
      if (scopes.length > 1 && rows.length >= needed) break
    }
    return rows
  }

  /** One report call → flattened rows matching the old data.gov.in shape. */
  private async fetchReport(
    isoDate: string,
    scope: { stateIds: number[]; marketIds: number[] },
  ): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/prices-and-arrivals/market-report/daily`, {
      method: 'POST',
      headers: { ...this.upstreamHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: isoDate,
        stateIds: scope.stateIds,
        marketIds: scope.marketIds,
        includeExcel: false,
      }),
      // A whole state (~250 mandis) takes ~5s upstream; allow headroom.
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) {
      this.logger.warn(`agmarknet report responded ${res.status}`)
      throw new ServiceUnavailableException('Mandi data provider error')
    }
    const body = await res.json()
    const rows: any[] = []
    for (const st of body?.states ?? []) {
      for (const mk of st?.markets ?? []) {
        const district = this.dims?.data.marketDistrict.get(mk.marketId) ?? null
        for (const c of mk?.commodities ?? []) {
          for (const d of c?.data ?? []) {
            rows.push({
              state: st.stateName ?? null,
              district,
              market: d.marketCenter ?? mk.marketName ?? null,
              commodity: c.commodityName ?? null,
              variety: d.variety ?? null,
              grade: d.grade ?? null,
              arrivalDate: this.toDmy(isoDate),
              minPrice: d.minimumPrice != null ? Number(d.minimumPrice) : null,
              maxPrice: d.maximumPrice != null ? Number(d.maximumPrice) : null,
              modalPrice: d.modalPrice != null ? Number(d.modalPrice) : null,
              // AGMARKNET quotes all prices in ₹ per Quintal (upstream: unitOfPrice).
              unit: 'Quintal',
            })
          }
        }
      }
    }
    return rows
  }

  /** Full state/district/market id map — one upstream call, cached for a day. */
  private async loadDimensions(): Promise<AgmDimensions | null> {
    if (this.dims && Date.now() - this.dims.at < this.dimsTtlMs) return this.dims.data
    this.dimsPromise ??= (async () => {
      try {
        const res = await fetch(`${this.baseUrl}/daily-price-arrival/filters`, {
          headers: this.upstreamHeaders,
          signal: AbortSignal.timeout(30000),
        })
        if (!res.ok) throw new Error(`filters responded ${res.status}`)
        const body = await res.json()
        const d = body?.data ?? {}
        const data: AgmDimensions = {
          // ids >= 100000 are "All …" sentinels, not real entities.
          states: (d.state_data ?? [])
            .filter((s: any) => s.state_id < 100000)
            .map((s: any) => ({ id: s.state_id, name: s.state_name })),
          districts: new Map(
            (d.district_data ?? [])
              .filter((x: any) => x.id < 100000 && x.state_id)
              .map((x: any) => [x.id, { name: x.district_name, stateId: x.state_id }]),
          ),
          markets: (d.market_data ?? [])
            .filter((m: any) => m.id < 100000 && m.state_id)
            .map((m: any) => ({
              id: m.id,
              name: m.mkt_name,
              stateId: m.state_id,
              districtId: m.district_id ?? null,
            })),
          marketDistrict: new Map<number, string | null>(),
        }
        for (const m of data.markets) {
          data.marketDistrict.set(m.id, m.districtId ? data.districts.get(m.districtId)?.name ?? null : null)
        }
        this.dims = { at: Date.now(), data }
        return data
      } catch (e) {
        this.logger.warn(`Could not load mandi dimensions: ${(e as Error).message}`)
        return null
      } finally {
        this.dimsPromise = undefined
      }
    })()
    return this.dimsPromise
  }

  /** Normalized name match: lowercase, drop 'APMC', collapse punctuation. */
  private norm(s: string) {
    return s.toLowerCase().replace(/\bapmc\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  }

  private findState(dims: AgmDimensions, name: string) {
    const n = this.norm(name)
    return (
      dims.states.find((s) => this.norm(s.name) === n) ||
      dims.states.find((s) => this.norm(s.name).includes(n) || n.includes(this.norm(s.name)))
    )
  }

  private findMarkets(dims: AgmDimensions, name: string, state?: { id: number }) {
    const n = this.norm(name)
    const pool = state ? dims.markets.filter((m) => m.stateId === state.id) : dims.markets
    return pool
      .filter((m) => {
        const mn = this.norm(m.name)
        return mn === n || mn.includes(n) || n.includes(mn)
      })
      .sort(
        (a, b) =>
          // Exact match wins; otherwise prefer the shortest name (least ambiguous).
          Number(this.norm(b.name) === n) - Number(this.norm(a.name) === n) ||
          a.name.length - b.name.length,
      )
      .slice(0, 5)
  }

  private parseDate(s: string): Date | undefined {
    const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/) // DD/MM/YYYY (frontend format)
    if (dmy) return new Date(+dmy[3], +dmy[2] - 1, +dmy[1])
    const iso = new Date(s) // YYYY-MM-DD and friends
    return Number.isNaN(iso.getTime()) ? undefined : iso
  }

  private toIso(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  private toDmy(iso: string) {
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  /** Stage a snapshot write; the file is flushed once, shortly after. */
  private persist(key: string, payload: any) {
    this.disk.set(key, { at: Date.now(), payload })
    // Evict the oldest entries beyond a cap so the file can't grow forever.
    if (this.disk.size > 200) {
      const oldest = [...this.disk.entries()]
        .sort((a, b) => a[1].at - b[1].at)
        .slice(0, this.disk.size - 200)
      for (const [k] of oldest) this.disk.delete(k)
    }
    this.diskDirty = true
    if (!this.diskTimer) {
      this.diskTimer = setTimeout(() => this.flushDisk(), 2000)
      this.diskTimer.unref?.()
    }
  }

  private flushDisk() {
    this.diskTimer = undefined
    if (!this.diskDirty) return
    try {
      mkdirSync(dirname(this.diskFile), { recursive: true })
      const tmp = `${this.diskFile}.tmp` // write-then-rename keeps reads atomic
      writeFileSync(tmp, JSON.stringify(Object.fromEntries(this.disk)))
      renameSync(tmp, this.diskFile)
      this.diskDirty = false
    } catch (e) {
      this.logger.warn(`Could not write mandi disk cache: ${(e as Error).message}`)
    }
  }

}
