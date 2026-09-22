'use client'

// Home-page "Newly Added Properties" strip — shows the most recently approved
// land/property listings (public marketplace only returns admin-approved,
// active listings, so nothing unverified ever appears here). Self-hides when
// there are no land listings.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, API_BASE } from '../../lib/api'
import { getSessionId } from '../../lib/session'
import { displayTitle, landRatePerAcre } from '../../lib/product-utils'
import { MapPin, IndianRupee, ArrowRight, Trees, Navigation } from 'lucide-react'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const t = {
  en: {
    title: 'Newly Added Properties',
    sub: 'Fresh agricultural land & plots just listed by owners.',
    viewAll: 'View all properties',
    acres: 'acres',
    perAcre: '/acre',
    approx: 'approx.',
    locationNotSet: 'Location not set',
    new: 'New',
  },
  hi: {
    title: 'नई जोड़ी गई संपत्तियाँ',
    sub: 'मालिकों द्वारा अभी सूचीबद्ध नई कृषि भूमि और प्लॉट।',
    viewAll: 'सभी संपत्तियाँ देखें',
    acres: 'एकड़',
    perAcre: '/एकड़',
    approx: 'लगभग',
    locationNotSet: 'स्थान सेट नहीं',
    new: 'नया',
  },
}

function productImage(p) {
  if (!p?.imageUrls) return null
  const imgs = Array.isArray(p.imageUrls) ? p.imageUrls : [p.imageUrls]
  const first = imgs[0]
  if (!first) return null
  if (typeof first === 'string') return BACKEND_URL + first
  if (first.thumb) return BACKEND_URL + first.thumb
  if (first.full) return BACKEND_URL + first.full
  return null
}

function daysAgo(date) {
  if (!date) return null
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  return d <= 0 ? 'today' : `${d}d ago`
}

export default function NewlyAddedProperties({ lang = 'en' }) {
  const router = useRouter()
  const text = t[lang] || t.en
  const [items, setItems] = useState(null)

  useEffect(() => {
    // Public list endpoint only returns admin-approved (active) listings,
    // newest first — exactly the "newly added property" feed. Top 20.
    api.getProducts({ category: 'land', limit: 20 })
      .then((res) => setItems(res?.items || []))
      .catch(() => setItems([]))
  }, [])

  if (!items || items.length === 0) return null

  const open = (p) => {
    const token = localStorage.getItem('kp_token')
    try {
      api.recordServiceInterest({
        sessionId: getSessionId(),
        serviceCode: 'LAND_PROPERTY',
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
    <section className='bg-white py-12'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <div className='flex items-end justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 md:text-3xl'>{text.title}</h2>
            <p className='mt-1 text-sm text-gray-500'>{text.sub}</p>
          </div>
          <button
            onClick={openAll}
            className='hidden items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 sm:inline-flex'
          >
            {text.viewAll} <ArrowRight className='h-4 w-4' />
          </button>
        </div>

        <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {items.map((p) => {
            const img = productImage(p)
            const rate = landRatePerAcre(p)
            return (
              <button
                key={p.id}
                onClick={() => open(p)}
                className='group flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg hover:ring-emerald-200'
              >
                <div className='relative h-40 bg-gray-100'>
                  {img ? (
                    <img src={img} alt={p.title} className='h-full w-full object-cover' />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50 text-emerald-200'>
                      <Trees className='h-12 w-12' />
                    </div>
                  )}
                  <span className='absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow'>
                    {text.new}
                  </span>
                  {p.latitude && p.longitude && (
                    <span className='absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-emerald-700 shadow'>
                      <Navigation className='h-3 w-3' /> GPS
                    </span>
                  )}
                  {p.quantity && (
                    <span className='absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur'>
                      {p.quantity} {text.acres}
                    </span>
                  )}
                </div>
                <div className='flex flex-1 flex-col p-4'>
                  <h3 className='truncate text-sm font-bold text-gray-900'>{displayTitle(p, lang)}</h3>
                  <div className='mt-1.5 flex items-center text-base font-extrabold text-emerald-700'>
                    <IndianRupee className='h-4 w-4' />
                    {(rate ?? Number(p.price)).toLocaleString('en-IN')}
                    <span className='ml-1 text-xs font-normal text-gray-500'>
                      {rate != null ? text.perAcre : text.approx}
                    </span>
                  </div>
                  <div className='mt-1 flex items-center gap-1 text-xs text-gray-500'>
                    <MapPin className='h-3.5 w-3.5 flex-shrink-0' />
                    <span className='truncate'>
                      {p.location || [p.district, p.state].filter(Boolean).join(', ') || text.locationNotSet}
                    </span>
                  </div>
                  <div className='mt-2 flex items-center justify-end text-xs text-gray-400'>
                    {/* Seller mobile is never public — members reveal it on the detail page. */}
                    <span>{daysAgo(p.activatedAt || p.createdAt)}</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={openAll}
          className='mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 sm:hidden'
        >
          {text.viewAll} <ArrowRight className='h-4 w-4' />
        </button>
      </div>
    </section>
  )
}
