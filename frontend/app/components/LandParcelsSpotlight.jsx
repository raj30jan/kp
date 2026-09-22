'use client'

// Dashboard spotlight for the logged-in user's OWN land / property listings
// (any status). Sits directly under the KPI cards. Shows aggregate stats
// (count, total acreage, combined asking value) plus a horizontal scroll of
// parcel cards, each linking to its marketplace detail page. Platform-wide
// land inventory lives on the home page (LandShowcase) and /marketplace.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, API_BASE } from '../../lib/api'
import { useLang } from '../../lib/lang-context'
import { displayTitle, landRatePerAcre } from '../../lib/product-utils'
import { Trees, MapPin, IndianRupee, ArrowRight, LandPlot } from 'lucide-react'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const t = {
  en: {
    title: 'My Land & Property Listings',
    sub: 'Agricultural land, plots & farmhouses you have listed',
    parcels: 'My Parcels',
    totalArea: 'Total Area',
    combinedValue: 'Asking Value',
    acres: 'acres',
    badge: 'Land',
    viewAll: 'Manage all my listings',
    locationNotSet: 'Location not set',
    perAcre: '/acre',
  },
  hi: {
    title: 'मेरी भूमि व संपत्ति सूचियाँ',
    sub: 'आपके द्वारा सूचीबद्ध खेती योग्य भूमि, प्लॉट व फार्महाउस',
    parcels: 'मेरे भूखंड',
    totalArea: 'कुल क्षेत्र',
    combinedValue: 'मांग मूल्य',
    acres: 'एकड़',
    badge: 'भूमि',
    viewAll: 'मेरी सभी सूचियाँ प्रबंधित करें',
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

// Compact INR formatting for large sums — e.g. 2.4 Cr, 85 L, 40 K
function formatINR(n) {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1).replace(/\.0$/, '')} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')} L`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`
  return `₹${n}`
}

export default function LandParcelsSpotlight() {
  const { lang } = useLang()
  const text = t[lang] || t.en
  const [parcels, setParcels] = useState(null) // null = loading

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token) { setParcels([]); return }
    api.getMyProducts({ category: 'land', limit: 50 }, token)
      .then((res) => setParcels(res?.items || []))
      .catch(() => setParcels([]))
  }, [])

  // Hide entirely while loading or when there is nothing to showcase —
  // the dashboard stays clean instead of showing an empty shell.
  if (!parcels || parcels.length === 0) return null

  const totalAcres = parcels.reduce((s, p) => s + (Number(p.quantity) || 0), 0)
  const totalValue = parcels.reduce((s, p) => s + (Number(p.price) || 0), 0)

  const stats = [
    { label: text.parcels, value: parcels.length },
    { label: text.totalArea, value: `${totalAcres.toLocaleString()} ${text.acres}` },
    { label: text.combinedValue, value: formatINR(totalValue) },
  ]

  return (
    <section className='overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 ring-1 ring-amber-200 shadow-sm'>
      {/* Header + aggregate stats */}
      <div className='flex flex-wrap items-center justify-between gap-4 p-5 pb-0 md:p-6 md:pb-0'>
        <div className='flex items-center gap-3'>
          <span className='rounded-2xl bg-amber-500 p-2.5 text-white shadow'>
            <LandPlot className='h-6 w-6' />
          </span>
          <div>
            <h2 className='text-lg font-bold text-gray-900 md:text-xl'>{text.title}</h2>
            <p className='text-sm text-gray-600'>{text.sub}</p>
          </div>
        </div>
        <div className='flex gap-3'>
          {stats.map((s) => (
            <div key={s.label} className='rounded-xl bg-white/80 px-4 py-2 text-center ring-1 ring-amber-100'>
              <p className='text-base font-bold text-amber-800 md:text-lg'>{s.value}</p>
              <p className='text-[11px] font-medium uppercase tracking-wide text-gray-500'>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal scroll of parcel cards */}
      <div className='flex gap-4 overflow-x-auto p-5 md:p-6'>
        {parcels.map((p) => (
          <Link
            key={p.id}
            href={`/marketplace/${p.id}`}
            className='group flex w-72 flex-shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-amber-100 transition hover:shadow-lg hover:ring-amber-300'
          >
            <div className='relative h-40 bg-gray-100'>
              {productImage(p) ? (
                <img src={productImage(p)} alt={p.title} className='h-full w-full object-cover' />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-amber-300'>
                  <Trees className='h-12 w-12' />
                </div>
              )}
              <span className='absolute left-2 top-2 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow'>
                {text.badge}
              </span>
              {/* Acreage is THE metric for land — pin it big on the image */}
              <span className='absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-bold text-amber-300'>
                {p.quantity} {text.acres}
              </span>
            </div>
            <div className='flex flex-1 flex-col p-3.5'>
              <h3 className='truncate text-sm font-semibold text-gray-900'>{displayTitle(p, lang)}</h3>
              <div className='mt-1.5 flex items-center justify-between'>
                <span className='flex items-center text-base font-bold text-emerald-700'>
                  <IndianRupee className='h-3.5 w-3.5' />
                  {(landRatePerAcre(p) ?? Number(p.price)).toLocaleString('en-IN')}
                  {landRatePerAcre(p) != null && (
                    <span className='ml-0.5 text-xs font-normal text-gray-500'>{text.perAcre}</span>
                  )}
                </span>
              </div>
              <div className='mt-1 flex items-center gap-1 text-xs text-gray-500'>
                <MapPin className='h-3 w-3' />
                {p.location || [p.district, p.state].filter(Boolean).join(', ') || text.locationNotSet}
              </div>
            </div>
          </Link>
        ))}

        {/* End-of-scroll card → full land listing in marketplace */}
        <Link
          href='/my-products'
          className='flex w-40 flex-shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-white/60 text-amber-700 transition hover:border-amber-500 hover:bg-white'
        >
          <ArrowRight className='h-6 w-6' />
          <span className='px-3 text-center text-xs font-semibold'>{text.viewAll}</span>
        </Link>
      </div>
    </section>
  )
}
