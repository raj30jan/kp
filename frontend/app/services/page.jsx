'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Phone, Wrench, Tractor, Stethoscope, FileSignature, Landmark, Truck, Briefcase, PlusCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

const TYPE_META = {
  labour: { icon: Wrench, en: 'Labour', hi: 'मज़दूर' },
  machinery: { icon: Tractor, en: 'Machinery', hi: 'मशीनरी' },
  veterinary: { icon: Stethoscope, en: 'Veterinary', hi: 'पशु चिकित्सा' },
  patwari: { icon: FileSignature, en: 'Patwari', hi: 'पटवारी' },
  loan_agent: { icon: Landmark, en: 'Loan / Subsidy Agent', hi: 'लोन / सब्सिडी एजेंट' },
  transport: { icon: Truck, en: 'Transport', hi: 'ट्रांसपोर्ट' },
  other: { icon: Briefcase, en: 'Other', hi: 'अन्य' },
}

const RATE_LABELS = {
  per_day: { en: '/day', hi: '/दिन' },
  per_hour: { en: '/hr', hi: '/घंटा' },
  per_acre: { en: '/acre', hi: '/एकड़' },
  per_visit: { en: '/visit', hi: '/विज़िट' },
  per_month: { en: '/month', hi: '/माह' },
  fixed: { en: 'fixed', hi: 'तय' },
  negotiable: { en: 'negotiable', hi: 'बातचीत पर' },
}

function ServicesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [type, setType] = useState(searchParams?.get('type') || '')
  const [q, setQ] = useState('')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 0 })
  const [loading, setLoading] = useState(true)

  const load = (overrides = {}) => {
    setLoading(true)
    const params = { type, q, state, district, limit: '12', ...overrides }
    api.getServices(params)
      .then(setData)
      .catch(() => setData({ items: [], total: 0, page: 1, pages: 0 }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [type]) // eslint-disable-line react-hooks/exhaustive-deps

  const pickType = (t) => {
    const next = type === t ? '' : t
    setType(next)
    router.replace(next ? `/services?type=${next}` : '/services', { scroll: false })
  }

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 py-14 text-white'>
        <div className='mx-auto max-w-7xl px-4 md:px-6'>
          <h1 className='text-3xl font-extrabold tracking-tight md:text-4xl'>
            {isHindi ? 'सेवाएँ — मज़दूर, मशीनरी, डॉक्टर, एजेंट' : 'Services — Labour, Machinery, Vets, Agents'}
          </h1>
          <p className='mt-3 max-w-2xl text-emerald-100'>
            {isHindi
              ? 'अपने गाँव और ज़िले में सेवा प्रदाता खोजें — या अपनी सेवा ऑफर करें'
              : 'Find service providers in your village and district — or offer your own service'}
          </p>
          <button
            onClick={() => router.push('/services/new')}
            className='mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50'
          >
            <PlusCircle className='h-4 w-4' />
            {isHindi ? 'अपनी सेवा ऑफर करें' : 'Offer Your Service'}
          </button>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-8 md:px-6'>

        {/* Type filter chips */}
        <div className='mb-5 flex flex-wrap gap-2'>
          {Object.entries(TYPE_META).map(([key, meta]) => {
            const Icon = meta.icon
            const active = type === key
            return (
              <button
                key={key}
                onClick={() => pickType(key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? 'bg-emerald-600 text-white shadow' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-emerald-50'
                }`}
              >
                <Icon className='h-4 w-4' />
                {isHindi ? meta.hi : meta.en}
              </button>
            )
          })}
        </div>

        {/* Search + location filters */}
        <div className='mb-6 flex flex-wrap gap-2'>
          <div className='relative flex-1 min-w-[200px]'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder={isHindi ? 'सेवा खोजें…' : 'Search services…'}
              className='h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none'
            />
          </div>
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder={isHindi ? 'राज्य' : 'State'}
            className='h-11 w-36 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none'
          />
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder={isHindi ? 'ज़िला' : 'District'}
            className='h-11 w-36 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none'
          />
          <button
            onClick={() => load()}
            className='h-11 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700'
          >
            {isHindi ? 'खोजें' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='h-44 animate-pulse rounded-2xl bg-white ring-1 ring-gray-100' />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <div className='rounded-2xl bg-white p-12 text-center ring-1 ring-gray-100'>
            <p className='text-gray-500'>
              {isHindi ? 'कोई सेवा नहीं मिली। पहली सेवा ऑफर करने वाले बनें!' : 'No services found. Be the first to offer one!'}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {data.items.map((s) => {
              const meta = TYPE_META[s.serviceType] || TYPE_META.other
              const Icon = meta.icon
              const rateLabel = RATE_LABELS[s.rateUnit] || RATE_LABELS.negotiable
              const thumb = Array.isArray(s.imageUrls) && s.imageUrls[0]?.thumb
              return (
                <Link
                  key={s.id}
                  href={`/services/${s.id}`}
                  className='flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md'
                >
                  <div className='mb-3 flex items-start justify-between gap-2'>
                    <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>
                      <Icon className='h-3.5 w-3.5' />
                      {isHindi ? meta.hi : meta.en}
                    </span>
                    {thumb && (
                      <img src={thumb} alt='' className='h-12 w-12 rounded-lg object-cover ring-1 ring-gray-100' />
                    )}
                  </div>
                  <h3 className='font-bold text-gray-900'>{isHindi && s.titleHi ? s.titleHi : s.title}</h3>
                  {s.description && (
                    <p className='mt-1 line-clamp-2 text-sm text-gray-600'>{s.description}</p>
                  )}
                  <div className='mt-3 flex items-center justify-between text-sm'>
                    <span className='font-semibold text-emerald-700'>
                      {s.rate ? `₹${Number(s.rate).toLocaleString('en-IN')} ${isHindi ? rateLabel.hi : rateLabel.en}` : (isHindi ? 'बातचीत पर' : 'Negotiable')}
                    </span>
                    <span className='inline-flex items-center gap-1 text-xs text-gray-500'>
                      <MapPin className='h-3.5 w-3.5' />
                      {[s.village, s.district].filter(Boolean).join(', ') || s.state || '—'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {data.pages > 1 && (
          <div className='mt-8 flex justify-center gap-2'>
            {[...Array(data.pages)].map((_, i) => (
              <button
                key={i}
                onClick={() => load({ page: String(i + 1) })}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium ${
                  data.page === i + 1 ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-slate-50' />}>
      <ServicesContent />
    </Suspense>
  )
}
