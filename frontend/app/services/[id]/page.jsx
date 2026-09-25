'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, MapPin, Phone, Eye, Briefcase, Loader2, PlusCircle } from 'lucide-react'
import { api } from '../../../lib/api'
import { getSessionId } from '../../../lib/session'
import { useLang } from '../../../lib/lang-context'
import { SERVICE_TYPE_META as TYPE_META, RATE_LABELS } from '../../../lib/service-types'
import ServiceSidebar from '../../components/ServiceSidebar'

function ServiceDetailContent() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  // Category the user had selected on the listing — keep it highlighted + on back.
  const selectedType = searchParams?.get('type') || ''

  const [svc, setSvc] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.getService(id)
      .then((s) => {
        setSvc(s)
        // Track who opened this service's detail page (mobile/userId/IP captured server-side).
        try {
          api.recordServiceInterest({
            sessionId: getSessionId(),
            serviceCode: 'SERVICE_VIEW',
            serviceName: `${(s.title || '').slice(0, 90)} #${s.id}`,
            sourcePage: 'service-detail',
            token: localStorage.getItem('kp_token') || undefined,
            mobile: localStorage.getItem('kp_mobile') || undefined,
          }).catch(() => {})
        } catch {}
      })
      .catch(() => setError(isHindi ? 'सेवा नहीं मिली' : 'Service not found'))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-50'>
        <div className='text-center'>
          <p className='text-gray-500'>{error}</p>
          <button onClick={() => router.push('/services')} className='mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white'>
            {isHindi ? 'सेवाओं पर वापस' : 'Back to services'}
          </button>
        </div>
      </div>
    )
  }

  if (!svc) {
    return <div className='flex min-h-screen items-center justify-center bg-slate-50'><Loader2 className='h-8 w-8 animate-spin text-emerald-600' /></div>
  }

  const meta = TYPE_META[svc.serviceType] || TYPE_META.other
  const Icon = meta.icon
  const rateLabel = RATE_LABELS[svc.rateUnit] || RATE_LABELS.negotiable
  const images = Array.isArray(svc.imageUrls) ? svc.imageUrls : []
  const passport = images[0] ? (images[0].full || images[0].thumb || images[0]) : null
  const location = [svc.village, svc.tehsil, svc.district, svc.state].filter(Boolean).join(', ')

  return (
    <div className='min-h-screen bg-slate-50'>
      <section className='mx-auto max-w-7xl px-4 py-10 md:px-6'>
        <div className='flex flex-col gap-6 lg:flex-row'>

          {/* Left panel — professions list (same as listing page) */}
          <ServiceSidebar
            activeType={selectedType || svc.serviceType}
            onSelect={(t) => router.push(t ? `/services?type=${t}` : '/services')}
          />

          {/* Right — service detail */}
          <div className='min-w-0 flex-1'>
        <div className='mb-5 flex items-center justify-between gap-3'>
          <button onClick={() => router.push(selectedType ? `/services?type=${selectedType}` : '/services')} className='inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-700'>
            <ArrowLeft className='h-4 w-4' /> {isHindi ? 'सभी सेवाएँ' : 'All services'}
          </button>
          <button
            onClick={() => router.push('/services/new')}
            className='inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600'
          >
            <PlusCircle className='h-4 w-4' />
            {isHindi ? 'नौकरी के लिए अपनी प्रोफ़ाइल जोड़ें' : 'Add your profile for jobs'}
          </button>
        </div>

        <div className='rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='flex items-start gap-4'>
              {passport && (
                <a href={passport} target='_blank' rel='noreferrer' className='shrink-0'>
                  <img
                    src={passport}
                    alt={isHindi ? 'पासपोर्ट फ़ोटो' : 'Passport photo'}
                    className='h-32 w-24 rounded-lg object-cover ring-2 ring-emerald-100'
                  />
                </a>
              )}
              <div>
                <span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>
                  <Icon className='h-3.5 w-3.5' />
                  {isHindi ? meta.hi : meta.en}
                </span>
                <h1 className='mt-3 text-2xl font-bold text-gray-900'>{isHindi && svc.titleHi ? svc.titleHi : svc.title}</h1>
                {isHindi && svc.titleHi && svc.title !== svc.titleHi && (
                  <p className='mt-1 text-sm text-gray-500'>{svc.title}</p>
                )}
              </div>
            </div>
            <div className='text-right'>
              <p className='text-2xl font-extrabold text-emerald-700'>
                {svc.rate ? `₹${Number(svc.rate).toLocaleString('en-IN')}` : (isHindi ? 'बातचीत पर' : 'Negotiable')}
              </p>
              {svc.rate && <p className='text-xs text-gray-500'>{isHindi ? rateLabel.hi : rateLabel.en}</p>}
            </div>
          </div>

          {svc.description && (
            <p className='mt-5 whitespace-pre-line text-sm leading-relaxed text-gray-700'>{svc.description}</p>
          )}

          {images.length > 0 && (
            <div className='mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3'>
              {images.map((img, i) => (
                <a key={i} href={img.full} target='_blank' rel='noreferrer'>
                  <img src={img.thumb || img.full} alt='' className='h-32 w-full rounded-xl object-cover ring-1 ring-gray-100 transition hover:opacity-90' />
                </a>
              ))}
            </div>
          )}

          <div className='mt-6 grid gap-3 sm:grid-cols-2'>
            <div className='flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-700'>
              <MapPin className='h-4 w-4 shrink-0 text-emerald-600' />
              {location || (isHindi ? 'स्थान उपलब्ध नहीं' : 'Location not specified')}
            </div>
            {svc.experienceYears != null && (
              <div className='flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-700'>
                <Briefcase className='h-4 w-4 shrink-0 text-emerald-600' />
                {svc.experienceYears} {isHindi ? 'वर्ष का अनुभव' : 'years experience'}
              </div>
            )}
            <div className='flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-500'>
              <Eye className='h-4 w-4 shrink-0 text-emerald-600' />
              {svc.views} {isHindi ? 'बार देखा गया' : 'views'}
            </div>
          </div>

          {svc.address && (
            <div className='mt-3 flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-700'>
              <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600' />
              <span>{svc.address}</span>
            </div>
          )}

          {/* Contact — service providers want to be hired, so mobile is shown directly */}
          <a
            href={`tel:${svc.mobile}`}
            className='mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700'
          >
            <Phone className='h-4 w-4' />
            {isHindi ? 'कॉल करें' : 'Call'} — {svc.mobile}
          </a>
        </div>

          </div>{/* end right column */}
        </div>{/* end flex */}
      </section>
    </div>
  )
}

export default function ServiceDetailPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-slate-50' />}>
      <ServiceDetailContent />
    </Suspense>
  )
}
