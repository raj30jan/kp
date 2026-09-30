import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

interface CityMeta {
  label: string
  lat: number
  lon: number
  imdId: number | null // IMD station/city id — used by api.imd.gov.in endpoints
}

// IMD ids are the WMO-style station indices IMD uses for cityforecast/current_wx.
// Where unknown they stay null and the Open-Meteo fallback serves that city.
const CITIES: Record<string, CityMeta> = {
  ludhiana: { label: 'Ludhiana', lat: 30.9010, lon: 75.8573, imdId: 42099 },
  amritsar: { label: 'Amritsar', lat: 31.6340, lon: 74.8723, imdId: 42071 },
  chandigarh: { label: 'Chandigarh', lat: 30.7333, lon: 76.7794, imdId: 42110 },
  delhi: { label: 'Delhi', lat: 28.6139, lon: 77.2090, imdId: 42182 },
  jaipur: { label: 'Jaipur', lat: 26.9124, lon: 75.7873, imdId: 42348 },
  lucknow: { label: 'Lucknow', lat: 26.8467, lon: 80.9462, imdId: 42369 },
  bhopal: { label: 'Bhopal', lat: 23.2599, lon: 77.4126, imdId: 42667 },
  patna: { label: 'Patna', lat: 25.5941, lon: 85.1376, imdId: 42479 },
}

// WMO weather interpretation codes → normalized condition key.
function codeToCondition(code: number | null | undefined): string {
  if (code == null) return 'clear'
  if (code === 0) return 'sunny'
  if (code === 1 || code === 2) return 'partly-cloudy'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 95) return 'thunderstorm'
  return 'clear'
}

const num = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Tolerant key lookup — IMD payloads use inconsistent key casing/spacing. */
function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k]
    const lower = Object.keys(obj).find((x) => x.toLowerCase().replace(/[\s_]+/g, '') === k.toLowerCase().replace(/[\s_]+/g, ''))
    if (lower && obj[lower] !== undefined && obj[lower] !== null && obj[lower] !== '') return obj[lower]
  }
  return null
}

export interface WeatherDay {
  date: string
  min: number | null
  max: number | null
  rain: number | null // % probability or mm — see `rainUnit`
  wind: number | null
  humidity: number | null
  code: string
}

export interface WeatherPayload {
  city: string
  source: 'imd' | 'open-meteo'
  updatedAt: string
  current: {
    temp: number | null
    min: number | null
    max: number | null
    humidity: number | null
    wind: number | null
    code: string
  } | null
  forecast: WeatherDay[]
  advisory: { icon: 'thermometer' | 'rain' | 'wind'; en: string; hi: string }[]
}

@Injectable()
export class WeatherService {
  private readonly log = new Logger(WeatherService.name)
  private readonly cache = new Map<string, { at: number; data: WeatherPayload }>()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 min — weather data updates slowly

  constructor(private readonly config: ConfigService) {}

  cityList(): string[] {
    return Object.values(CITIES).map((c) => c.label)
  }

  async forCity(cityRaw?: string): Promise<WeatherPayload> {
    const key = (cityRaw || 'delhi').trim().toLowerCase()
    const city = CITIES[key] || CITIES.delhi

    const hit = this.cache.get(key)
    if (hit && Date.now() - hit.at < this.CACHE_TTL) return hit.data

    // Primary: official IMD API (api.imd.gov.in) — needs an org-issued key
    // passed via the Authorization header. Falls back to Open-Meteo.
    const apiKey = this.config.get<string>('IMD_API_KEY')
    let data: WeatherPayload | null = null
    if (apiKey && city.imdId) {
      data = await this.fromImd(city, apiKey).catch((e) => {
        this.log.warn(`IMD fetch failed for ${city.label}: ${e?.message}`)
        return null
      })
    }
    if (!data) {
      data = await this.fromOpenMeteo(city).catch((e) => {
        this.log.error(`Open-Meteo fetch failed for ${city.label}: ${e?.message}`)
        return null
      })
    }
    if (!data) {
      data = { city: city.label, source: 'open-meteo', updatedAt: new Date().toISOString(), current: null, forecast: [], advisory: [] }
    }
    this.cache.set(key, { at: Date.now(), data })
    return data
  }

  // ── IMD (govt) source ──────────────────────────────────────────────────────
  private async fromImd(city: CityMeta, apiKey: string): Promise<WeatherPayload | null> {
    const headers = { Authorization: `Bearer ${apiKey}` }
    const [fcRes, wxRes] = await Promise.all([
      fetch(`https://api.imd.gov.in/api/v1/cityforecast?id=${city.imdId}`, { headers }).then((r) => r.json()).catch(() => null),
      fetch(`https://api.imd.gov.in/api/v1/current_wx?id=${city.imdId}`, { headers }).then((r) => r.json()).catch(() => null),
    ])
    if (!fcRes && !wxRes) return null

    // IMD current_wx fields: CURR_TEMP, MIN_TEMP, MAX_TEMP, RH, WIND_SPEED,
    // WEATHER_CODE, DATE, TIME — documented in api.imd.gov.in/public/api_reference.html
    const wx = Array.isArray(wxRes?.data) ? wxRes.data[0] : wxRes?.data ?? wxRes
    const current = wx
      ? {
          temp: num(pick(wx, 'CURR_TEMP', 'curr_temp', 'temp')),
          min: num(pick(wx, 'MIN_TEMP', 'min_temp')),
          max: num(pick(wx, 'MAX_TEMP', 'max_temp')),
          humidity: num(pick(wx, 'RH', 'rh', 'humidity')),
          wind: num(pick(wx, 'WIND_SPEED', 'wind_speed')),
          code: codeToCondition(num(pick(wx, 'WEATHER_CODE', 'weather_code'))),
        }
      : null

    // IMD cityforecast rows: Date, Max Temp, Min Temp, Rainfall, Morning/Afternoon
    // Weather text. Field names are normalized case-insensitively. Rainfall is
    // predicted mm — bucketed to a % chance so it matches Open-Meteo's output.
    const mmToChance = (mm: number | null): number | null =>
      mm == null ? null : mm <= 0 ? 0 : mm < 2.5 ? 20 : mm < 7.5 ? 40 : mm < 15 ? 60 : 80
    const rows: Record<string, unknown>[] = Array.isArray(fcRes?.data) ? fcRes.data : Array.isArray(fcRes) ? fcRes : []
    const forecast: WeatherDay[] = rows.slice(0, 7).map((r) => ({
      date: String(pick(r, 'Date', 'date', 'forecast_date') ?? ''),
      max: num(pick(r, 'Max Temp', 'max_temp', 'MaxTemp')),
      min: num(pick(r, 'Min Temp', 'min_temp', 'MinTemp')),
      rain: mmToChance(num(pick(r, 'Rainfall', 'rainfall', 'rain', 'Prcp'))),
      wind: num(pick(r, 'Wind Speed', 'wind_speed')),
      humidity: num(pick(r, 'Humidity', 'humidity', 'RH')),
      code: codeToCondition(num(pick(r, 'Weather Code', 'weather_code'))),
    }))

    if (!current && forecast.length === 0) return null
    return { city: city.label, source: 'imd', updatedAt: new Date().toISOString(), current, forecast, advisory: this.advise(current, forecast) }
  }

  // ── Open-Meteo fallback — keyless live data (aggregates national met services) ─
  private async fromOpenMeteo(city: CityMeta): Promise<WeatherPayload | null> {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weather_code` +
      `&timezone=Asia%2FKolkata&forecast_days=7`
    const res = await fetch(url)
    if (!res.ok) return null
    const j = await res.json()

    const c = j.current
    const cur = c
      ? {
          temp: num(c.temperature_2m),
          min: num(j.daily?.temperature_2m_min?.[0]),
          max: num(j.daily?.temperature_2m_max?.[0]),
          humidity: num(c.relative_humidity_2m),
          wind: num(c.wind_speed_10m),
          code: codeToCondition(num(c.weather_code)),
        }
      : null

    const d = j.daily || {}
    const forecast: WeatherDay[] = (d.time || []).slice(0, 7).map((date: string, i: number) => ({
      date,
      max: num(d.temperature_2m_max?.[i]),
      min: num(d.temperature_2m_min?.[i]),
      rain: num(d.precipitation_probability_max?.[i]),
      wind: num(d.wind_speed_10m_max?.[i]),
      humidity: null,
      code: codeToCondition(num(d.weather_code?.[i])),
    }))

    return { city: city.label, source: 'open-meteo', updatedAt: new Date().toISOString(), current: cur, forecast, advisory: this.advise(cur, forecast) }
  }

  // ── Farming advisory derived from the actual readings ──────────────────────
  private advise(current: WeatherPayload['current'], forecast: WeatherDay[]) {
    const out: WeatherPayload['advisory'] = []
    const t = current?.temp ?? forecast[0]?.max
    if (t != null) {
      out.push({
        icon: 'thermometer',
        en: t >= 38 ? `High temperature (${Math.round(t)}°C). Irrigate in early morning or evening; avoid midday fieldwork.` : `Temperature around ${Math.round(t)}°C — normal field conditions.`,
        hi: t >= 38 ? `अधिक तापमान (${Math.round(t)}°C)। सुबह या शाम को सिंचाई करें; दोपहर के खेती काम से बचें।` : `तापमान लगभग ${Math.round(t)}°C — खेती के लिए सामान्य मौसम।`,
      })
    }
    const wetDay = forecast.find((f) => (f.rain ?? 0) >= 60)
    if (wetDay) {
      const day = new Date(wetDay.date).toLocaleDateString('en-IN', { weekday: 'long' })
      out.push({
        icon: 'rain',
        en: `Heavy rain likely on ${day} (~${Math.round(wetDay.rain!)}%). Cover harvested crops and check field drainage.`,
        hi: `${day} को भारी बारिश की संभावना (~${Math.round(wetDay.rain!)}%)। कटी फसल ढकें और खेतों की जल निकासी जाँचें।`,
      })
    }
    const windy = forecast.find((f) => (f.wind ?? 0) >= 25) || (current?.wind ?? 0) >= 25
    if (windy) {
      out.push({
        icon: 'wind',
        en: 'Strong winds expected — not suitable for pesticide spraying. Secure loose cover on stored produce.',
        hi: 'तेज़ हवा की संभावना — कीटनाशक छिड़काव के लिए उपयुक्त नहीं। रखी उपज की ढकाई सुरक्षित करें।',
      })
    }
    return out
  }
}
