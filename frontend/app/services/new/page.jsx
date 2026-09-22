'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImagePlus, Loader2, Wrench, Tractor, Stethoscope, FileSignature, Landmark, Truck, Briefcase } from 'lucide-react'
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

const RATE_UNITS = [
  { v: 'per_day', en: 'per day', hi: 'प्रति दिन' },
  { v: 'per_hour', en: 'per hour', hi: 'प्रति घंटा' },
  { v: 'per_acre', en: 'per acre', hi: 'प्रति एकड़' },
  { v: 'per_visit', en: 'per visit', hi: 'प्रति विज़िट' },
  { v: 'per_month', en: 'per month', hi: 'प्रति माह' },
  { v: 'fixed', en: 'fixed price', hi: 'तय कीमत' },
  { v: 'negotiable', en: 'negotiable', hi: 'बातचीत पर' },
]

export default function NewServicePage() {
  const router = useRouter()
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [token, setToken] = useState(null)
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [images, setImages] = useState([])

  const [form, setForm] = useState({
    serviceType: 'labour',
    title: '',
    titleHi: '',
    description: '',
    rate: '',
    rateUnit: 'per_day',
    mobile: '',
    village: '',
    tehsil: '',
    district: '',
    state: '',
  })

  useEffect(() => {
    const t = localStorage.getItem('kp_token')
    if (!t) {
      router.push('/login?service=Offer Your Service')
      return
    }
    api.getMe(t)
      .then((me) => {
        setToken(t)
        setForm((f) => ({ ...f, mobile: me?.mobile || f.mobile }))
      })
      .catch(() => {
        localStorage.removeItem('kp_token')
        router.push('/login?service=Offer Your Service')
      })
      .finally(() => setChecking(false))
  }, [router])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) return setError(isHindi ? 'शीर्षक आवश्यक है' : 'Title is required')
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setError(isHindi ? 'मान्य 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Enter a valid 10-digit mobile number')
    if (form.rateUnit !== 'negotiable' && form.rate === '') {
      return setError(isHindi ? 'दर दर्ज करें या "बातचीत पर" चुनें' : 'Enter a rate or choose "negotiable"')
    }

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v) })
    images.forEach((img) => fd.append('images', img))

    setSubmitting(true)
    try {
      await api.createService(fd, token)
      setDone(true)
    } catch (err) {
      setError(err?.message || (isHindi ? 'सबमिट नहीं हो सका' : 'Submission failed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return <div className='flex min-h-screen items-center justify-center bg-slate-50'><Loader2 className='h-8 w-8 animate-spin text-emerald-600' /></div>
  }

  if (done) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-50 px-4'>
        <div className='max-w-md rounded-3xl bg-white p-10 text-center shadow-lg ring-1 ring-gray-100'>
          <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100'>
            <Wrench className='h-7 w-7 text-emerald-600' />
          </div>
          <h1 className='text-xl font-bold text-gray-900'>{isHindi ? 'सेवा सबमिट हो गई!' : 'Service submitted!'}</h1>
          <p className='mt-3 text-sm text-gray-600'>
            {isHindi
              ? 'आपकी सेवा एडमिन की समीक्षा के लिए भेजी गई है। स्वीकृति के बाद यह साइट पर लाइव होगी।'
              : 'Your service has been sent for admin review. It will go live once approved.'}
          </p>
          <div className='mt-6 flex justify-center gap-3'>
            <button onClick={() => router.push('/my-services')} className='rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'>
              {isHindi ? 'मेरी सेवाएँ' : 'My Services'}
            </button>
            <button onClick={() => router.push('/services')} className='rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50'>
              {isHindi ? 'सेवाएँ देखें' : 'Browse Services'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const inputCls = 'h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none'
  const labelCls = 'mb-1.5 block text-sm font-medium text-gray-700'

  return (
    <div className='min-h-screen bg-slate-50'>
      <section className='mx-auto max-w-3xl px-4 py-10 md:px-6'>
        <button onClick={() => router.push('/services')} className='mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-700'>
          <ArrowLeft className='h-4 w-4' /> {isHindi ? 'सेवाओं पर वापस' : 'Back to services'}
        </button>

        <div className='rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8'>
          <h1 className='text-2xl font-bold text-gray-900'>{isHindi ? 'अपनी सेवा ऑफर करें' : 'Offer Your Service'}</h1>
          <p className='mt-1 text-sm text-gray-500'>
            {isHindi ? 'सबमिट करने के बाद एडमिन स्वीकृति पर लाइव होगा' : 'Goes live after admin approval'}
          </p>

          <form onSubmit={submit} className='mt-6 space-y-5'>
            {/* Service type picker */}
            <div>
              <label className={labelCls}>{isHindi ? 'सेवा का प्रकार' : 'Service type'} *</label>
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
                {Object.entries(TYPE_META).map(([key, meta]) => {
                  const Icon = meta.icon
                  const active = form.serviceType === key
                  return (
                    <button
                      type='button'
                      key={key}
                      onClick={() => setForm((f) => ({ ...f, serviceType: key }))}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        active ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className='h-4 w-4 shrink-0' />
                      {isHindi ? meta.hi : meta.en}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={labelCls}>{isHindi ? 'शीर्षक' : 'Title'} *</label>
              <input className={inputCls} value={form.title} onChange={set('title')} maxLength={255}
                placeholder={isHindi ? 'जैसे: ड्राइवर सहित ट्रैक्टर किराए पर' : 'e.g. Tractor with driver for hire'} />
            </div>

            <div>
              <label className={labelCls}>{isHindi ? 'शीर्षक (हिंदी)' : 'Title (Hindi)'}</label>
              <input className={inputCls} value={form.titleHi} onChange={set('titleHi')} maxLength={255}
                placeholder={isHindi ? 'वैकल्पिक' : 'Optional'} />
            </div>

            <div>
              <label className={labelCls}>{isHindi ? 'विवरण' : 'Description'}</label>
              <textarea className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none' rows={3}
                value={form.description} onChange={set('description')}
                placeholder={isHindi ? 'अपनी सेवा, अनुभव, उपलब्धता बताएं' : 'Describe your service, experience, availability'} />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className={labelCls}>{isHindi ? 'दर (₹)' : 'Rate (₹)'}</label>
                <input className={inputCls} type='number' min='0' value={form.rate} onChange={set('rate')}
                  disabled={form.rateUnit === 'negotiable'}
                  placeholder={form.rateUnit === 'negotiable' ? '—' : '1500'} />
              </div>
              <div>
                <label className={labelCls}>{isHindi ? 'दर इकाई' : 'Rate unit'} *</label>
                <select className={inputCls} value={form.rateUnit} onChange={set('rateUnit')}>
                  {RATE_UNITS.map((u) => <option key={u.v} value={u.v}>{isHindi ? u.hi : u.en}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>{isHindi ? 'संपर्क मोबाइल' : 'Contact mobile'} *</label>
              <input className={inputCls} value={form.mobile} onChange={set('mobile')} maxLength={10} inputMode='numeric'
                placeholder='9876543210' />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className={labelCls}>{isHindi ? 'गाँव' : 'Village'}</label>
                <input className={inputCls} value={form.village} onChange={set('village')} maxLength={128} />
              </div>
              <div>
                <label className={labelCls}>{isHindi ? 'तहसील' : 'Tehsil'}</label>
                <input className={inputCls} value={form.tehsil} onChange={set('tehsil')} maxLength={64} />
              </div>
              <div>
                <label className={labelCls}>{isHindi ? 'ज़िला' : 'District'}</label>
                <input className={inputCls} value={form.district} onChange={set('district')} maxLength={64} />
              </div>
              <div>
                <label className={labelCls}>{isHindi ? 'राज्य' : 'State'}</label>
                <input className={inputCls} value={form.state} onChange={set('state')} maxLength={64} />
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className={labelCls}>{isHindi ? 'फ़ोटो (वैकल्पिक, अधिकतम 5)' : 'Photos (optional, max 5)'}</label>
              <label className='flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600'>
                <ImagePlus className='h-5 w-5' />
                {images.length ? `${images.length} ${isHindi ? 'फ़ोटो चुनी गईं' : 'photo(s) selected'}` : (isHindi ? 'फ़ोटो जोड़ें' : 'Add photos')}
                <input
                  type='file' accept='image/*' multiple className='hidden'
                  onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))}
                />
              </label>
            </div>

            {error && <p className='rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700'>{error}</p>}

            <button
              type='submit' disabled={submitting}
              className='flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60'
            >
              {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
              {isHindi ? 'समीक्षा के लिए सबमिट करें' : 'Submit for Review'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
