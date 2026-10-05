'use client'

import { useState } from 'react'
import { Plane, CheckCircle, Loader2, ArrowUpRight, ArrowDownLeft, Globe, FileText, Phone } from 'lucide-react'
import { api } from '../../lib/api'
import { getSessionId } from '../../lib/session'
import { useLang } from '../../lib/lang-context'
import { useIndiaStates } from '../../lib/use-location'
import { MAIN_CATEGORIES } from '../../lib/main-categories'

const QUANTITY_UNITS = ['kg', 'quintal', 'tonne', 'piece', 'litre']

const t = {
  en: {
    title: 'Export & Import Desk',
    subtitle: 'Tell us what you want to export or import — our team will connect you with buyers, documentation support and logistics.',
    direction: 'I want to',
    export: 'Export (Sell abroad)',
    import: 'Import (Buy from abroad)',
    category: 'Product Category',
    product: 'Product Name',
    productPh: 'e.g. Basmati Rice, Alphonso Mango, Tractor Spare Parts',
    country: 'Country',
    countryPh: 'e.g. UAE, USA — leave blank for domestic trade',
    state: 'Your State',
    statePh: 'Select state',
    quantity: 'Quantity',
    quantityPh: 'e.g. 500',
    unit: 'Unit',
    mobile: 'Mobile Number',
    mobilePh: '10-digit mobile number',
    notes: 'Additional Details (optional)',
    notesPh: 'Packaging, timeline, target price, documentation help needed…',
    submit: 'Submit Inquiry',
    submitting: 'Submitting…',
    success: 'Thank you! Your inquiry has been recorded. Our export/import team will call you shortly.',
    error: 'Could not submit. Please check the details and try again.',
    required: 'Please fill category, product and mobile number.',
    infoTitle: 'How it works',
    info1: 'Share your product & destination details in the form.',
    info2: 'Our trade desk verifies buyers/suppliers and documentation (IEC, APEDA, FSSAI).',
    info3: 'We connect you with matched partners and guide the shipment.',
    portalsTitle: 'Useful Govt Portals',
    call: 'Prefer to talk? Call us at +91 92116 90182',
  },
  hi: {
    title: 'निर्यात और आयात डेस्क',
    subtitle: 'बताइए आप क्या निर्यात या आयात करना चाहते हैं — हमारी टीम खरीदारों, दस्तावेज़ी सहायता और लॉजिस्टिक्स से जोड़ेगी।',
    direction: 'मैं चाहता हूँ',
    export: 'निर्यात (विदेश में बेचें)',
    import: 'आयात (विदेश से खरीदें)',
    category: 'उत्पाद श्रेणी',
    product: 'उत्पाद का नाम',
    productPh: 'जैसे बासमती चावल, अल्फांसो आम, ट्रैक्टर पार्ट्स',
    country: 'देश',
    countryPh: 'जैसे UAE, USA — घरेलू व्यापार के लिए खाली छोड़ें',
    state: 'आपका राज्य',
    statePh: 'राज्य चुनें',
    quantity: 'मात्रा',
    quantityPh: 'जैसे 500',
    unit: 'इकाई',
    mobile: 'मोबाइल नंबर',
    mobilePh: '10 अंकों का मोबाइल नंबर',
    notes: 'अतिरिक्त जानकारी (वैकल्पिक)',
    notesPh: 'पैकेजिंग, समय-सीमा, लक्षित कीमत, दस्तावेज़ सहायता…',
    submit: 'पूछताछ भेजें',
    submitting: 'भेजा जा रहा है…',
    success: 'धन्यवाद! आपकी पूछताछ दर्ज हो गई है। हमारी निर्यात/आयात टीम जल्द ही कॉल करेगी।',
    error: 'सबमिट नहीं हो सका। कृपया विवरण जाँचकर दोबारा प्रयास करें।',
    required: 'कृपया श्रेणी, उत्पाद और मोबाइल नंबर भरें।',
    infoTitle: 'यह कैसे काम करता है',
    info1: 'फॉर्म में अपने उत्पाद और गंतव्य की जानकारी साझा करें।',
    info2: 'हमारी ट्रेड डेस्क खरीदार/आपूर्तिकर्ता और दस्तावेज़ (IEC, APEDA, FSSAI) सत्यापित करती है।',
    info3: 'हम आपको उपयुक्त भागीदारों से जोड़ते हैं और शिपमेंट में मार्गदर्शन करते हैं।',
    portalsTitle: 'उपयोगी सरकारी पोर्टल',
    call: 'बात करना पसंद करेंगे? +91 92116 90182 पर कॉल करें',
  },
}

const GOVT_PORTALS = [
  { en: 'DGFT — Foreign Trade', hi: 'DGFT — विदेशी व्यापार', href: 'https://www.dgft.gov.in' },
  { en: 'APEDA — Agri Exports', hi: 'APEDA — कृषि निर्यात', href: 'https://apeda.gov.in' },
  { en: 'ICEGATE — Customs', hi: 'ICEGATE — सीमा शुल्क', href: 'https://www.icegate.gov.in' },
]

export default function ExportImportPage() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const text = isHindi ? t.hi : t.en
  const states = useIndiaStates()

  const [form, setForm] = useState({
    direction: 'EXPORT',
    category: '',
    product: '',
    country: '',
    state: '',
    quantity: '',
    quantityUnit: 'kg',
    mobile: '',
    notes: '',
  })
  const [status, setStatus] = useState('idle') // idle | saving | done | error
  const [error, setError] = useState('')

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.category || !form.product.trim() || !/^[6-9]\d{9}$/.test(form.mobile)) {
      setError(text.required)
      return
    }
    setError('')
    setStatus('saving')
    try {
      await api.createExportInquiry({
        sessionId: getSessionId(),
        token: localStorage.getItem('kp_token') || undefined,
        direction: form.direction,
        category: form.category,
        product: form.product.trim(),
        ...(form.country.trim() ? { country: form.country.trim() } : {}),
        ...(form.state ? { state: states.find((s) => s.id === form.state)?.name || form.state } : {}),
        ...(form.quantity ? { quantity: form.quantity } : {}),
        quantityUnit: form.quantityUnit,
        mobile: form.mobile,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      })
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err?.message || text.error)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
  const labelCls = 'mb-1.5 block text-sm font-semibold text-gray-700'

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 md:px-6'>
      {/* Header */}
      <div className='mb-8 flex items-start gap-4'>
        <span className='rounded-2xl bg-emerald-100 p-3 text-emerald-700'>
          <Plane className='h-7 w-7' />
        </span>
        <div>
          <h1 className='text-2xl font-extrabold text-gray-900 md:text-3xl'>{text.title}</h1>
          <p className='mt-1 max-w-2xl text-sm text-gray-600'>{text.subtitle}</p>
        </div>
      </div>

      <div className='grid gap-8 lg:grid-cols-3'>
        {/* Inquiry form */}
        <div className='lg:col-span-2'>
          {status === 'done' ? (
            <div className='flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center'>
              <CheckCircle className='h-14 w-14 text-emerald-600' />
              <p className='mt-4 max-w-md font-semibold text-emerald-800'>{text.success}</p>
            </div>
          ) : (
            <form onSubmit={submit} className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
              {/* Direction toggle */}
              <label className={labelCls}>{text.direction}</label>
              <div className='mb-5 grid grid-cols-2 gap-3'>
                {[
                  { v: 'EXPORT', label: text.export, Icon: ArrowUpRight },
                  { v: 'IMPORT', label: text.import, Icon: ArrowDownLeft },
                ].map(({ v, label, Icon }) => (
                  <button
                    type='button'
                    key={v}
                    onClick={() => set('direction', v)}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                      form.direction === v
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-gray-300 text-gray-600 hover:border-emerald-300'
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                    {label}
                  </button>
                ))}
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className={labelCls}>{text.category} *</label>
                  <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
                    <option value=''>—</option>
                    {/* Land and jobs aren't tradeable goods — excluded */}
                    {MAIN_CATEGORIES.filter((c) => c.key !== 'jobs' && c.key !== 'land').map((c) => (
                      <option key={c.key} value={c.key}>
                        {isHindi ? c.hi : c.en}
                      </option>
                    ))}
                    <option value='other'>{isHindi ? 'अन्य' : 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{text.product} *</label>
                  <input
                    className={inputCls}
                    value={form.product}
                    onChange={(e) => set('product', e.target.value)}
                    placeholder={text.productPh}
                    maxLength={128}
                  />
                </div>
                <div>
                  <label className={labelCls}>{text.country}</label>
                  <input
                    className={inputCls}
                    value={form.country}
                    onChange={(e) => set('country', e.target.value)}
                    placeholder={text.countryPh}
                    maxLength={64}
                  />
                </div>
                <div>
                  <label className={labelCls}>{text.state}</label>
                  <select className={inputCls} value={form.state} onChange={(e) => set('state', e.target.value)}>
                    <option value=''>{text.statePh}</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className={labelCls}>{text.quantity}</label>
                    <input
                      className={inputCls}
                      type='number'
                      min='0'
                      step='any'
                      value={form.quantity}
                      onChange={(e) => set('quantity', e.target.value)}
                      placeholder={text.quantityPh}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>{text.unit}</label>
                    <select className={inputCls} value={form.quantityUnit} onChange={(e) => set('quantityUnit', e.target.value)}>
                      {QUANTITY_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{text.mobile} *</label>
                  <input
                    className={inputCls}
                    value={form.mobile}
                    onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder={text.mobilePh}
                    inputMode='numeric'
                  />
                </div>
              </div>

              <div className='mt-4'>
                <label className={labelCls}>{text.notes}</label>
                <textarea
                  className={`${inputCls} min-h-[80px]`}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder={text.notesPh}
                  maxLength={2000}
                />
              </div>

              {error && <p className='mt-3 text-sm font-medium text-red-600'>{error}</p>}

              <button
                type='submit'
                disabled={status === 'saving'}
                className='mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60'
              >
                {status === 'saving' && <Loader2 className='h-4 w-4 animate-spin' />}
                {status === 'saving' ? text.submitting : text.submit}
              </button>
            </form>
          )}
        </div>

        {/* Side panel */}
        <div className='space-y-5'>
          <div className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
            <h2 className='mb-3 flex items-center gap-2 font-bold text-gray-900'>
              <FileText className='h-5 w-5 text-emerald-600' />
              {text.infoTitle}
            </h2>
            <ol className='list-decimal space-y-2 pl-5 text-sm text-gray-600'>
              <li>{text.info1}</li>
              <li>{text.info2}</li>
              <li>{text.info3}</li>
            </ol>
          </div>
          <div className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
            <h2 className='mb-3 flex items-center gap-2 font-bold text-gray-900'>
              <Globe className='h-5 w-5 text-emerald-600' />
              {text.portalsTitle}
            </h2>
            <ul className='space-y-2 text-sm'>
              {GOVT_PORTALS.map((p) => (
                <li key={p.href}>
                  <a
                    href={p.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-emerald-700 hover:underline'
                  >
                    {isHindi ? p.hi : p.en} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className='flex items-center gap-3 rounded-2xl bg-emerald-700 p-5 text-sm font-semibold text-white'>
            <Phone className='h-5 w-5 shrink-0' />
            {text.call}
          </div>
        </div>
      </div>
    </div>
  )
}
