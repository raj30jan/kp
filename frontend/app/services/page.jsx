'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, PlusCircle, LocateFixed, X } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'
import { SERVICE_TYPE_META as TYPE_META, RATE_LABELS } from '../../lib/service-types'
import { useIndiaStates, useDistricts, useTehsils } from '../../lib/use-location'
import ServiceSidebar from '../components/ServiceSidebar'

function ServicesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [type, setType] = useState(searchParams?.get('type') || '')
  const [q, setQ] = useState('')
  const [stateId, setStateId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [tehsil, setTehsil] = useState('')
  const [village, setVillage] = useState('')
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [geo, setGeo] = useState(null) // { lat, lng } when 'near me' is active
  const [radius, setRadius] = useState('50')
  const [locating, setLocating] = useState(false)

  // Cascading location lists — pick from dropdowns, no typing needed.
  const states = useIndiaStates()
  const districts = useDistricts(stateId)
  const tehsils = useTehsils(districtId)
  const stateName = states.find((s) => s.id === stateId)?.name || ''
  const districtName = districts.find((d) => d.id === districtId)?.name || ''

  const load = (overrides = {}) => {
    setLoading(true)
    const params = { type, q, state: stateName, district: districtName, tehsil, village, limit: '12', ...overrides }
    if (geo) {
      params.lat = geo.lat
      params.lng = geo.lng
      if (radius !== '0') params.radius = radius
    }
    api.getServices(params)
      .then(setData)
      .catch(() => setData({ items: [], total: 0, page: 1, pages: 0 }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [type, geo, radius, stateId, districtId, tehsil]) // eslint-disable-line react-hooks/exhaustive-deps

  const captureNearMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

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
            {isHindi ? 'नौकरी के लिए अपनी प्रोफ़ाइल जोड़ें' : 'Add your profile for jobs'}
          </button>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-8 md:px-6'>
        <div className='flex flex-col gap-6 lg:flex-row'>

          {/* Left panel — professions list */}
          <ServiceSidebar activeType={type} onSelect={pickType} />

          {/* Right — search, filters, listing grid */}
          <div className='min-w-0 flex-1'>

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
          <button
            onClick={() => load()}
            className='h-11 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700'
          >
            {isHindi ? 'खोजें' : 'Search'}
          </button>
          <button
            onClick={() => router.push('/services/new')}
            className='inline-flex h-11 items-center gap-2 rounded-lg bg-amber-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600'
          >
            <PlusCircle className='h-4 w-4' />
            {isHindi ? 'नौकरी के लिए अपनी प्रोफ़ाइल जोड़ें' : 'Add your profile for jobs'}
          </button>
        </div>

        {/* Location filters — pick from dropdowns, no typing needed */}
        <div className='mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4'>
          <select
            value={stateId}
            onChange={(e) => { setStateId(e.target.value); setDistrictId(''); setTehsil('') }}
            className='h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none'
          >
            <option value=''>{isHindi ? 'राज्य चुनें' : 'Select state'}</option>
            {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={districtId}
            onChange={(e) => { setDistrictId(e.target.value); setTehsil('') }}
            disabled={!stateId}
            className='h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400'
          >
            <option value=''>{isHindi ? 'ज़िला चुनें' : 'Select district'}</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            value={tehsil}
            onChange={(e) => setTehsil(e.target.value)}
            disabled={!districtId}
            className='h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400'
          >
            <option value=''>{isHindi ? 'तहसील चुनें' : 'Select tehsil'}</option>
            {tehsils.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
          <input
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder={isHindi ? 'गाँव का नाम' : 'Village name'}
            className='h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none'
          />
        </div>

        {/* Near me — nearest providers first, optional radius */}
        <div className='mb-6 flex flex-wrap items-center gap-2'>
          {geo ? (
            <>
              <span className='inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white'>
                <LocateFixed className='h-4 w-4' />
                {isHindi ? 'नज़दीकी पहले' : 'Nearest first'}
              </span>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className='h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none'
              >
                <option value='10'>{isHindi ? '10 किमी के भीतर' : 'Within 10 km'}</option>
                <option value='25'>{isHindi ? '25 किमी के भीतर' : 'Within 25 km'}</option>
                <option value='50'>{isHindi ? '50 किमी के भीतर' : 'Within 50 km'}</option>
                <option value='100'>{isHindi ? '100 किमी के भीतर' : 'Within 100 km'}</option>
                <option value='0'>{isHindi ? 'कोई दूरी सीमा नहीं' : 'Any distance'}</option>
              </select>
              <button
                onClick={() => setGeo(null)}
                className='inline-flex h-11 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 hover:bg-gray-50'
              >
                <X className='h-4 w-4' />
                {isHindi ? 'हटाएँ' : 'Clear'}
              </button>
            </>
          ) : (
            <button
              onClick={captureNearMe}
              disabled={locating}
              className='inline-flex h-11 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60'
            >
              <LocateFixed className='h-4 w-4' />
              {locating ? (isHindi ? 'लोकेशन ले रहे हैं…' : 'Locating…') : (isHindi ? 'मेरे नज़दीक खोजें' : 'Find near me')}
            </button>
          )}
        </div>

        {/* Results — row/column table */}
        {loading ? (
          <div className='space-y-2'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-xl bg-white ring-1 ring-gray-100' />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <div className='rounded-2xl bg-white p-12 text-center ring-1 ring-gray-100'>
            <p className='text-gray-500'>
              {isHindi ? 'कोई सेवा नहीं मिली। पहली सेवा ऑफर करने वाले बनें!' : 'No services found. Be the first to offer one!'}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100'>
            <table className='w-full min-w-[760px] text-left text-sm'>
              <thead>
                <tr className='border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400'>
                  <th className='px-4 py-3 font-semibold'>{isHindi ? 'फ़ोटो' : 'Photo'}</th>
                  <th className='px-4 py-3 font-semibold'>{isHindi ? 'नाम / सेवा' : 'Name / Service'}</th>
                  <th className='px-4 py-3 font-semibold'>{isHindi ? 'अनुभव' : 'Exp'}</th>
                  <th className='px-4 py-3 font-semibold'>{isHindi ? 'पता' : 'Address'}</th>
                  <th className='px-4 py-3 font-semibold'>{isHindi ? 'पिन' : 'Pincode'}</th>
                  <th className='px-4 py-3 font-semibold text-right'>{isHindi ? 'कार्रवाई' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {data.items.map((s) => {
                  const meta = TYPE_META[s.serviceType] || TYPE_META.other
                  const Icon = meta.icon
                  const thumb = Array.isArray(s.imageUrls) && (s.imageUrls[0]?.thumb || s.imageUrls[0])
                  const imgSrc = typeof thumb === 'string' ? thumb : thumb?.thumb || thumb?.url
                  const addr = [s.village, s.tehsil, s.district, s.state].filter(Boolean).join(', ') || s.address || '—'
                  return (
                    <tr key={s.id} className='transition hover:bg-emerald-50/40'>
                      <td className='px-4 py-3'>
                        {imgSrc ? (
                          <img src={imgSrc} alt='' className='h-12 w-10 rounded-md object-cover ring-1 ring-gray-200' />
                        ) : (
                          <span className='flex h-12 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-500 ring-1 ring-gray-200'>
                            <Icon className='h-5 w-5' />
                          </span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        <Link href={`/services/${s.id}${type ? `?type=${type}` : ''}`} className='font-semibold text-gray-900 hover:text-emerald-700'>
                          {isHindi && s.titleHi ? s.titleHi : s.title}
                        </Link>
                        <div className='mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-400'>
                          <Icon className='h-3 w-3' />
                          {isHindi ? meta.hi : meta.en}
                        </div>
                      </td>
                      <td className='px-4 py-3 text-gray-600'>
                        {s.experienceYears != null ? `${s.experienceYears} ${isHindi ? 'वर्ष' : 'yrs'}` : '—'}
                      </td>
                      <td className='max-w-[200px] px-4 py-3 text-gray-600'>
                        <span className='line-clamp-2'>{addr}</span>
                      </td>
                      <td className='px-4 py-3 text-gray-600'>{s.pincode || '—'}</td>
                      <td className='px-4 py-3 text-right'>
                        <Link
                          href={`/services/${s.id}${type ? `?type=${type}` : ''}`}
                          className='inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700'
                        >
                          {isHindi ? 'देखें' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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

          </div>{/* end right column */}
        </div>{/* end flex */}
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
