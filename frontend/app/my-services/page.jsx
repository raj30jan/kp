'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Loader2, MapPin, RefreshCw, Trash2, Wrench, Tractor, Stethoscope, FileSignature, Landmark, Truck, Briefcase } from 'lucide-react'
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

const STATUS_BADGE = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  expired: 'bg-slate-100 text-slate-600 ring-slate-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
}

export default function MyServicesPage() {
  const router = useRouter()
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [token, setToken] = useState(null)
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const load = (t) => {
    setLoading(true)
    api.getMyServices({ limit: '50' }, t)
      .then(setData)
      .catch(() => setData({ items: [], total: 0 }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = localStorage.getItem('kp_token')
    if (!t) {
      router.push('/login?service=My Services')
      return
    }
    api.getMe(t)
      .then(() => { setToken(t); load(t) })
      .catch(() => {
        localStorage.removeItem('kp_token')
        router.push('/login?service=My Services')
      })
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  const reactivate = async (id) => {
    setBusy(id)
    try {
      await api.reactivateService(id, token)
      load(token)
    } catch {} finally { setBusy('') }
  }

  const remove = async (id) => {
    if (!confirm(isHindi ? 'यह सेवा लिस्टिंग हटा दें?' : 'Delete this service listing?')) return
    setBusy(id)
    try {
      await api.deleteService(id, token)
      load(token)
    } catch {} finally { setBusy('') }
  }

  if (loading && !token) {
    return <div className='flex min-h-screen items-center justify-center bg-slate-50'><Loader2 className='h-8 w-8 animate-spin text-emerald-600' /></div>
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <section className='mx-auto max-w-5xl px-4 py-10 md:px-6'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
          <h1 className='text-2xl font-bold text-gray-900'>{isHindi ? 'मेरी सेवाएँ' : 'My Services'}</h1>
          <button
            onClick={() => router.push('/services/new')}
            className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
          >
            <PlusCircle className='h-4 w-4' />
            {isHindi ? 'नई सेवा ऑफर करें' : 'Offer New Service'}
          </button>
        </div>

        {loading ? (
          <div className='space-y-3'>{[...Array(3)].map((_, i) => <div key={i} className='h-24 animate-pulse rounded-2xl bg-white ring-1 ring-gray-100' />)}</div>
        ) : data.items.length === 0 ? (
          <div className='rounded-2xl bg-white p-12 text-center ring-1 ring-gray-100'>
            <p className='text-gray-500'>{isHindi ? 'आपने अभी कोई सेवा ऑफर नहीं की है' : "You haven't offered any services yet"}</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {data.items.map((s) => {
              const meta = TYPE_META[s.serviceType] || TYPE_META.other
              const Icon = meta.icon
              return (
                <div key={s.id} className='flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-gray-100'>
                  <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700'>
                    <Icon className='h-5 w-5' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h3 className='font-semibold text-gray-900'>{isHindi && s.titleHi ? s.titleHi : s.title}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_BADGE[s.status] || STATUS_BADGE.pending}`}>
                        {s.status}
                      </span>
                    </div>
                    <p className='mt-0.5 flex items-center gap-1 text-xs text-gray-500'>
                      <MapPin className='h-3 w-3' />
                      {[s.village, s.district, s.state].filter(Boolean).join(', ') || '—'}
                      {s.rate ? ` · ₹${Number(s.rate).toLocaleString('en-IN')} ${s.rateUnit}` : ` · ${isHindi ? 'बातचीत पर' : 'negotiable'}`}
                    </p>
                    {s.status === 'pending' && (
                      <p className='mt-1 text-xs text-amber-600'>{isHindi ? 'एडमिन स्वीकृति की प्रतीक्षा में' : 'Awaiting admin approval'}</p>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    {s.status === 'expired' && (
                      <button
                        onClick={() => reactivate(s.id)} disabled={busy === s.id}
                        className='inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50'
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${busy === s.id ? 'animate-spin' : ''}`} />
                        {isHindi ? 'फिर से सक्रिय करें' : 'Reactivate'}
                      </button>
                    )}
                    <button
                      onClick={() => remove(s.id)} disabled={busy === s.id}
                      className='inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                      {isHindi ? 'हटाएँ' : 'Delete'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
