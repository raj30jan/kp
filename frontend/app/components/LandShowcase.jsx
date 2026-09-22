'use client'

// Home-page showcase for land & property listings (>= 1 acre).
// Sits between the Newly Added Products marquee and Our Services — the
// "premium tier" moment of the page. Dark emerald + gold treatment sets it
// apart visually from the light product sections and signals high-value
// real estate. Self-hides when there are no land listings.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, API_BASE } from '../../lib/api'
import { getSessionId } from '../../lib/session'
import { displayTitle, landRatePerAcre } from '../../lib/product-utils'
import { LandPlot, MapPin, IndianRupee, ArrowRight, Trees, Sparkles } from 'lucide-react'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const t = {
  en: {
    eyebrow: 'Premium Listings',
    title: 'Land & Property for Sale',
    sub: 'Verified agricultural land, plots and farmhouses listed by owners across India.',
    parcels: 'Parcels',
    totalArea: 'Total Area',
    combinedValue: 'Combined Value',
    acres: 'acres',
    badge: 'Land',
    viewAll: 'Explore all land',
    locationNotSet: 'Location not set',
    perAcre: '/acre',
  },
  hi: {
    eyebrow: 'प्रीमियम सूचियाँ',
    title: 'बिक्री हेतु भूमि व संपत्ति',
    sub: 'भारत भर के मालिकों द्वारा सूचीबद्ध सत्यापित कृषि भूमि, प्लॉट और फार्महाउस।',
    parcels: 'भूखंड',
    totalArea: 'कुल क्षेत्र',
    combinedValue: 'कुल मूल्य',
    acres: 'एकड़',
    badge: 'भूमि',
    viewAll: 'सभी भूमि देखें',
    locationNotSet: 'स्थान सेट नहीं',
    perAcre: '/एकड़',
  },
}

function productImage(p) {
  if (!p.imageUrls) return null
  const imgs = Array.isArray(p.imageUrls) ? p.imageUrls : [p.imageUrls]
  if (imgs.length === 0) return null
  const first = imgs[0]
  if (typeof first === 'string') return BACKEND_URL + first
  if (first?.thumb) return BACKEND_URL + first.thumb
  if (first?.full) return BACKEND_URL + first.full
  return null
}

// Compact INR for large sums — 2.4 Cr / 85 L / 40 K
function formatINR(n) {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1).replace(/\.0$/, '')} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')} L`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`
  return `₹${n}`
}

export default function LandShowcase({ lang = 'hi' }) {
  const router = useRouter()
  const text = t[lang] || t.en
  const [parcels, setParcels] = useState(null)

  useEffect(() => {
    api.getLargeLandParcels(1)
      .then((res) => setParcels(res?.items || []))
      .catch(() => setParcels([]))
  }, [])

  if (!parcels || parcels.length === 0) return null

  const totalAcres = parcels.reduce((s, p) => s + (Number(p.quantity) || 0), 0)
  const totalValue = parcels.reduce((s, p) => s + (Number(p.price) || 0), 0)
  const stats = [
    { label: text.parcels, value: parcels.length },
    { label: text.totalArea, value: `${totalAcres.toLocaleString()} ${text.acres}` },
    { label: text.combinedValue, value: formatINR(totalValue) },
  ]

  // Guests go to login first (with ?next= back to the parcel); logged-in
  // users land directly on the listing. Interest is recorded either way.
  const openParcel = (p) => {
    const token = localStorage.getItem('kp_token')
    try {
      api.recordServiceInterest({
        sessionId: getSessionId(),
        serviceCode: 'LAND_PARCEL',
        serviceName: p.title,
        sourcePage: 'home',
        token: token || undefined,
        mobile: localStorage.getItem('kp_mobile') || undefined,
      }).catch(() => {})
    } catch {}
    const dest = `/marketplace/${p.id}`
    router.push(token ? dest : `/login?next=${encodeURIComponent(dest)}`)
  }

  const openAll = () => {
    const token = localStorage.getItem('kp_token')
    const dest = '/marketplace?category=land'
    router.push(token ? dest : `/login?next=${encodeURIComponent(dest)}`)
  }

  return (
    <section className='relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-900 py-14'>
      {/* subtle decorative glow */}
      <div className='pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl' />

      <div className='relative mx-auto max-w-7xl px-4 md:px-6'>
        {/* Header + stats */}
        <div className='flex flex-wrap items-end justify-between gap-5'>
          <div className='flex items-center gap-3'>
            <span className='rounded-2xl bg-amber-500 p-3 text-emerald-950 shadow-lg'>
              <LandPlot className='h-7 w-7' />
            </span>
            <div>
              <p className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400'>
                <Sparkles className='h-3.5 w-3.5' /> {text.eyebrow}
              </p>
              <h2 className='mt-1 text-2xl font-extrabold text-white md:text-3xl'>{text.title}</h2>
              <p className='mt-1 max-w-xl text-sm text-emerald-200'>{text.sub}</p>
            </div>
          </div>
          <div className='flex gap-3'>
            {stats.map((s) => (
              <div key={s.label} className='rounded-xl bg-white/10 px-4 py-2 text-center ring-1 ring-white/15 backdrop-blur'>
                <p className='text-base font-bold text-amber-300 md:text-lg'>{s.value}</p>
                <p className='text-[11px] font-medium uppercase tracking-wide text-emerald-200'>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Parcel cards */}
        <div className='mt-8 flex gap-5 overflow-x-auto pb-2'>
          {parcels.map((p) => (
            <button
              key={p.id}
              onClick={() => openParcel(p)}
              className='group flex w-72 flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-white text-left shadow-xl ring-1 ring-white/10 transition hover:-translate-y-1 hover:shadow-2xl hover:ring-amber-400/50'
            >
              <div className='relative h-44 bg-emerald-950/20'>
                {productImage(p) ? (
                  <img src={productImage(p)} alt={p.title} className='h-full w-full object-cover' />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-amber-50 text-emerald-300'>
                    <Trees className='h-14 w-14' />
                  </div>
                )}
                <span className='absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-950 shadow'>
                  {text.badge}
                </span>
                <span className='absolute bottom-3 right-3 rounded-lg bg-emerald-950/80 px-2.5 py-1 text-xs font-bold text-amber-300 backdrop-blur'>
                  {p.quantity} {text.acres}
                </span>
              </div>
              <div className='flex flex-1 flex-col p-4'>
                <h3 className='truncate text-sm font-bold text-gray-900'>{displayTitle(p, lang)}</h3>
                <div className='mt-1.5 flex items-center text-lg font-extrabold text-emerald-700'>
                  <IndianRupee className='h-4 w-4' />
                  {(landRatePerAcre(p) ?? Number(p.price)).toLocaleString('en-IN')}
                  {landRatePerAcre(p) != null && (
                    <span className='ml-0.5 text-xs font-normal text-gray-500'>{text.perAcre}</span>
                  )}
                </div>
                <div className='mt-1 flex items-center gap-1 text-xs text-gray-500'>
                  <MapPin className='h-3.5 w-3.5' />
                  {p.location || [p.district, p.state].filter(Boolean).join(', ') || text.locationNotSet}
                </div>
              </div>
            </button>
          ))}

          {/* End card → all land listings */}
          <button
            onClick={openAll}
            className='flex w-44 flex-shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-amber-400/40 bg-white/5 text-amber-300 transition hover:border-amber-400 hover:bg-white/10'
          >
            <ArrowRight className='h-7 w-7' />
            <span className='px-3 text-center text-sm font-semibold'>{text.viewAll}</span>
          </button>
        </div>
      </div>
    </section>
  )
}
