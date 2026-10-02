'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Search, Briefcase, Clock, Users } from 'lucide-react'
import { SERVICE_TYPE_META } from '../../lib/service-types'
import { API_BASE } from '../../lib/api'

// Agriculture jobs & one-time / daily / hourly service providers. Two clear
// doors — FIND a service (hire) or OFFER one (earn) — followed by big tiles
// for the trades farmers actually call: patwari, vet, labour, electrician,
// plumber, raj mistri, tubewell boring, machinery driver, etc. Every key maps
// to a real backend service type so /services?type=… returns live listings.
const t = {
  en: {
    eyebrow: 'Jobs & Services',
    title: 'Agriculture Jobs & Village Services',
    sub: 'Hire trusted local help by the hour, day or job — or list your own skill and earn.',
    find: 'Find a Service',
    findSub: 'Browse verified providers near you',
    offer: 'Offer Your Service',
    offerSub: 'Post your skill — get calls from farmers',
    viewAll: 'View all services',
    basis: 'Daily · Hourly · One-time',
    providers: 'providers',
    registered: 'registered providers',
  },
  hi: {
    eyebrow: 'नौकरियाँ व सेवाएँ',
    title: 'कृषि नौकरियाँ व ग्रामीण सेवाएँ',
    sub: 'घंटे, दिन या काम के हिसाब से भरोसेमंद स्थानीय सहायता लें — या अपना कौशल सूचीबद्ध करें और कमाएँ।',
    find: 'सेवा खोजें',
    findSub: 'अपने पास सत्यापित प्रदाता देखें',
    offer: 'अपनी सेवा दें',
    offerSub: 'अपना कौशल पोस्ट करें — किसानों से कॉल पाएँ',
    viewAll: 'सभी सेवाएँ देखें',
    basis: 'दैनिक · घंटेवार · एक बार',
    providers: 'प्रदाता',
    registered: 'पंजीकृत प्रदाता',
  },
}

// Ordered for a farmer: land/animal/labour first, then trades, then rest.
const FEATURED_TYPES = [
  'labour',
  'harvest_labour',
  'machinery',
  'machinery_driver',
  'veterinary',
  'patwari',
  'land_surveyor',
  'tubewell_boring',
  'crop_sprayer',
  'drone_operator',
  'soil_testing',
  'electrician',
  'plumber',
  'mason',
  'carpenter',
  'painter',
  'pipe_fitter',
  'solar_technician',
  'transport',
  'cold_storage',
  'motor_mechanic',
  'gardener',
  'plant_nursery',
  'milkman',
  'loan_agent',
  'insurance_agent',
  'technician',
]

export default function JobsServicesSection({ lang = 'hi', onFind, onOffer, onType }) {
  const text = t[lang] || t.en

  // Live registered-provider counts — { total, byType: { patwari: n, ... } }.
  const [counts, setCounts] = useState(null)
  useEffect(() => {
    fetch(`${API_BASE}/services/counts`)
      .then((r) => r.json())
      .then((d) => setCounts(d || {}))
      .catch(() => {})
  }, [])

  return (
    <section className='bg-white py-12 md:py-16'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <div className='mb-8 text-center'>
          <span className='inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-sm font-semibold text-sky-800'>
            <Briefcase className='h-4 w-4' />
            {text.eyebrow}
          </span>
          <h2 className='mt-4 text-3xl font-bold text-gray-900 md:text-4xl'>{text.title}</h2>
          <p className='mx-auto mt-3 max-w-2xl text-gray-600'>{text.sub}</p>
        </div>

        {/* Two doors */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <button
            onClick={onFind}
            className='group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 p-5 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl md:p-6'
          >
            <span className='rounded-2xl bg-white/20 p-3 backdrop-blur'>
              <Search className='h-8 w-8' />
            </span>
            <span className='flex-1'>
              <span className='block text-2xl font-black'>{text.find}</span>
              <span className='block text-sm text-sky-100'>{text.findSub}</span>
              {counts && (
                <span className='mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold text-white'>
                  <Users className='h-3.5 w-3.5' />
                  {(counts.total ?? 0).toLocaleString('en-IN')} {text.registered}
                </span>
              )}
            </span>
            <ArrowRight className='h-6 w-6 transition group-hover:translate-x-1' />
          </button>
          <button
            onClick={onOffer}
            className='group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-5 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl md:p-6'
          >
            <span className='rounded-2xl bg-white/20 p-3 backdrop-blur'>
              <Briefcase className='h-8 w-8' />
            </span>
            <span className='flex-1'>
              <span className='block text-2xl font-black'>{text.offer}</span>
              <span className='block text-sm text-violet-100'>{text.offerSub}</span>
            </span>
            <ArrowRight className='h-6 w-6 transition group-hover:translate-x-1' />
          </button>
        </div>

        {/* Trade tiles */}
        <div className='mt-6 flex items-center justify-between'>
          <span className='inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500'>
            <Clock className='h-4 w-4' />
            {text.basis}
          </span>
          {counts && (
            <span className='inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700'>
              <Users className='h-4 w-4' />
              {(counts.total ?? 0).toLocaleString('en-IN')} {text.providers}
            </span>
          )}
          <button onClick={onFind} className='inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-800'>
            {text.viewAll}
            <ArrowRight className='h-4 w-4' />
          </button>
        </div>
        <div className='mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9'>
          {FEATURED_TYPES.map((key) => {
            const meta = SERVICE_TYPE_META[key]
            if (!meta) return null
            const Icon = meta.icon
            return (
              <button
                key={key}
                onClick={() => onType?.(key, meta.en)}
                className='group flex flex-col items-center rounded-2xl border border-gray-100 bg-slate-50 px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-md'
              >
                <span className='flex h-12 w-12 items-center justify-center rounded-full bg-white text-sky-700 shadow-sm ring-1 ring-gray-100 transition group-hover:bg-sky-600 group-hover:text-white'>
                  <Icon className='h-6 w-6' />
                </span>
                <span className='mt-2 line-clamp-2 text-xs font-bold leading-tight text-gray-800 md:text-[13px]'>
                  {lang === 'hi' ? meta.hi : meta.en}
                </span>
                {counts && (
                  <span className={`mt-1 text-[10px] font-bold leading-none ${(counts.byType?.[key] ?? 0) > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {(counts.byType?.[key] ?? 0).toLocaleString('en-IN')} {text.providers}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
