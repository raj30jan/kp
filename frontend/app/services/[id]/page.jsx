'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Phone, Eye, Wrench, Tractor, Stethoscope, FileSignature, Landmark, Truck, Briefcase, Loader2 } from 'lucide-react'
import { api } from '../../../lib/api'
import { useLang } from '../../../lib/lang-context'

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
  per_day: { en: 'per day', hi: 'प्रति दिन' },
  per_hour: { en: 'per hour', hi: 'प्रति घंटा' },
  per_acre: { en: 'per acre', hi: 'प्रति एकड़' },
  per_visit: { en: 'per visit', hi: 'प्रति विज़िट' },
  per_month: { en: 'per month', hi: 'प्रति माह' },
  fixed: { en: 'fixed price', hi: 'तय कीमत' },
  negotiable: { en: 'negotiable', hi: 'बातचीत पर' },
}

export default function ServiceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [svc, setSvc] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.getService(id)
      .then(setSvc)
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
  const location = [svc.village, svc.tehsil, svc.district, svc.state].filter(Boolean).join(', ')

  return (
    <div className='min-h-screen bg-slate-50'>
      <section className='mx-auto max-w-4xl px-4 py-10 md:px-6'>
        <button onClick={() => router.push('/services')} className='mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-700'>
          <ArrowLeft className='h-4 w-4' /> {isHindi ? 'सभी सेवाएँ' : 'All services'}
        </button>

        <div className='rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
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
            <div className='flex items-center gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-gray-500'>
              <Eye className='h-4 w-4 shrink-0 text-emerald-600' />
              {svc.views} {isHindi ? 'बार देखा गया' : 'views'}
            </div>
          </div>

          {/* Contact — service providers want to be hired, so mobile is shown directly */}
          <a
            href={`tel:${svc.mobile}`}
            className='mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700'
          >
            <Phone className='h-4 w-4' />
            {isHindi ? 'कॉल करें' : 'Call'} — {svc.mobile}
          </a>
        </div>
      </section>
    </div>
  )
}
