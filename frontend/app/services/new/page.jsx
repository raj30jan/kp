'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImagePlus, Loader2, FileText, Crosshair, Wrench } from 'lucide-react'
import { api } from '../../../lib/api'
import { useLang } from '../../../lib/lang-context'
import { SERVICE_TYPE_META as TYPE_META, RATE_UNITS } from '../../../lib/service-types'
import { useIndiaStates, useDistricts, useTehsils } from '../../../lib/use-location'
import ServiceSidebar from '../../components/ServiceSidebar'

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
  const [aadhaar, setAadhaar] = useState(null)
  const [resume, setResume] = useState(null)
  const [locating, setLocating] = useState(false)
  const [stateId, setStateId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [typeQuery, setTypeQuery] = useState('')
  const [typeOpen, setTypeOpen] = useState(false)

  // Cascading location lists — pick from dropdowns, no typing needed.
  const states = useIndiaStates()
  const districts = useDistricts(stateId)
  const tehsils = useTehsils(districtId)

  const [form, setForm] = useState({
    serviceType: 'labour',
    title: '',
    titleHi: '',
    description: '',
    rate: '',
    rateUnit: 'per_day',
    mobile: '',
    experienceYears: '',
    address: '',
    village: '',
    tehsil: '',
    district: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
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
    if (form.experienceYears === '' || Number(form.experienceYears) < 0) {
      return setError(isHindi ? 'कुल अनुभव (वर्ष) दर्ज करें' : 'Enter total experience (years)')
    }
    if (!form.address.trim()) return setError(isHindi ? 'पता आवश्यक है' : 'Address is required')
    // Aadhaar, photos and resume are optional — providers can add them later.

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v) })
    images.forEach((img) => fd.append('images', img))
    if (aadhaar) fd.append('aadhaar', aadhaar)
    if (resume) fd.append('resume', resume)

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

  const captureLocation = () => {
    if (!navigator.geolocation) return setError(isHindi ? 'इस डिवाइस पर लोकेशन उपलब्ध नहीं' : 'Geolocation not supported')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        setForm((f) => ({ ...f, latitude: lat, longitude: lng }))
        // Reverse-geocode to a readable address and auto-fill the address field.
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`, { headers: { 'Accept-Language': 'en' } })
          const geo = await res.json()
          const a = geo.address || {}
          const addr = [a.road || a.neighbourhood || a.suburb, a.village || a.town || a.city, a.state_district || a.county, a.state, a.postcode]
            .filter(Boolean).join(', ')
          if (addr) setForm((f) => ({ ...f, address: f.address || addr }))
        } catch {}
        setLocating(false)
      },
      () => { setLocating(false); setError(isHindi ? 'लोकेशन नहीं मिली — अनुमति दें' : 'Could not get location — allow permission') },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const inputCls = 'h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none'
  const labelCls = 'mb-1.5 block text-sm font-medium text-gray-700'
  const fileCls = 'flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600'

  return (
    <div className='min-h-screen bg-slate-50'>
      <section className='mx-auto max-w-7xl px-4 py-10 md:px-6'>
        <div className='flex flex-col gap-6 lg:flex-row'>

          {/* Left panel — professions list; clicking one picks the service type */}
          <ServiceSidebar
            activeType={form.serviceType}
            onSelect={(t) => (t ? setForm((f) => ({ ...f, serviceType: t })) : router.push('/services'))}
          />

          {/* Right — offer-service form */}
          <div className='min-w-0 flex-1'>
        <button onClick={() => router.push('/services')} className='mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-700'>
          <ArrowLeft className='h-4 w-4' /> {isHindi ? 'सेवाओं पर वापस' : 'Back to services'}
        </button>

        <div className='rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 md:p-8'>
          <h1 className='text-2xl font-bold text-gray-900'>{isHindi ? 'नौकरी के लिए अपनी प्रोफ़ाइल जोड़ें' : 'Add your profile for jobs'}</h1>
          <p className='mt-1 text-sm text-gray-500'>
            {isHindi ? 'सबमिट करने के बाद एडमिन स्वीकृति पर लाइव होगा' : 'Goes live after admin approval'}
          </p>

          <form onSubmit={submit} className='mt-6 space-y-5'>
            {/* Service type — searchable type-ahead (40 professions) */}
            <div className='relative'>
              <label className={labelCls}>{isHindi ? 'सेवा का प्रकार' : 'Service type'} *</label>
              {(() => {
                const selectedMeta = TYPE_META[form.serviceType]
                const selectedLabel = selectedMeta
                  ? (isHindi ? `${selectedMeta.hi} (${selectedMeta.en})` : `${selectedMeta.en} (${selectedMeta.hi})`)
                  : ''
                const q = typeQuery.trim().toLowerCase()
                const matches = Object.entries(TYPE_META)
                  .filter(([key, meta]) =>
                    !q || meta.en.toLowerCase().includes(q) || meta.hi.includes(typeQuery.trim()) || key.toLowerCase().includes(q),
                  )
                  .sort(([, a], [, b]) => (isHindi ? a.hi : a.en).localeCompare(isHindi ? b.hi : b.en, isHindi ? 'hi' : 'en'))
                const pick = (key) => { setForm((f) => ({ ...f, serviceType: key })); setTypeOpen(false); setTypeQuery('') }
                return (
                  <>
                    <input
                      className={inputCls}
                      value={typeOpen ? typeQuery : selectedLabel}
                      placeholder={isHindi ? 'टाइप करके खोजें… जैसे agent' : 'Type to search… e.g. agent'}
                      onFocus={() => { setTypeOpen(true); setTypeQuery('') }}
                      onChange={(e) => { setTypeQuery(e.target.value); setTypeOpen(true) }}
                      onBlur={() => setTimeout(() => setTypeOpen(false), 150)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && typeOpen && matches.length) { e.preventDefault(); pick(matches[0][0]) }
                        else if (e.key === 'Escape') setTypeOpen(false)
                      }}
                    />
                    {typeOpen && (
                      <ul className='absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg'>
                        {matches.length === 0 && (
                          <li className='px-3 py-2 text-sm text-gray-400'>{isHindi ? 'कोई मेल नहीं' : 'No match'}</li>
                        )}
                        {matches.map(([key, meta]) => (
                          <li key={key}>
                            <button
                              type='button'
                              onMouseDown={() => pick(key)}
                              className={`flex w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 ${
                                form.serviceType === key ? 'bg-emerald-50 font-semibold text-emerald-700' : 'text-gray-700'
                              }`}
                            >
                              {isHindi ? `${meta.hi} (${meta.en})` : `${meta.en} (${meta.hi})`}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )
              })()}
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

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className={labelCls}>{isHindi ? 'संपर्क मोबाइल' : 'Contact mobile'} *</label>
                <input className={inputCls} value={form.mobile} onChange={set('mobile')} maxLength={10} inputMode='numeric'
                  placeholder='9876543210' />
              </div>
              <div>
                <label className={labelCls}>{isHindi ? 'कुल अनुभव (वर्ष)' : 'Total experience (years)'} *</label>
                <input className={inputCls} type='number' min='0' max='70' value={form.experienceYears} onChange={set('experienceYears')}
                  placeholder='5' />
              </div>
            </div>

            <div>
              <label className={labelCls}>{isHindi ? 'पूरा पता' : 'Full address'} *</label>
              <textarea className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none' rows={2}
                value={form.address} onChange={set('address')} maxLength={500}
                placeholder={isHindi ? 'मकान नंबर, गली/मोहल्ला, मुख्य सड़क, लैंडमार्क' : 'House no., street/area, main road, landmark'} />
            </div>

            {/* Location capture */}
            <div>
              <label className={labelCls}>{isHindi ? 'लोकेशन' : 'Location'}</label>
              <button
                type='button' onClick={captureLocation} disabled={locating}
                className='inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60'
              >
                {locating ? <Loader2 className='h-4 w-4 animate-spin' /> : <Crosshair className='h-4 w-4' />}
                {form.latitude ? (isHindi ? 'लोकेशन कैप्चर हो गई — दोबारा लें' : 'Location captured — retake') : (isHindi ? 'मेरी लोकेशन कैप्चर करें' : 'Capture my location')}
              </button>
              {form.latitude && (
                <p className='mt-1.5 text-xs text-emerald-700'>📍 {form.latitude}, {form.longitude}</p>
              )}
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className={labelCls}>{isHindi ? 'राज्य' : 'State'} *</label>
                <select className={inputCls} value={stateId}
                  onChange={(e) => {
                    const id = e.target.value
                    setStateId(id); setDistrictId('')
                    const nm = states.find((s) => s.id === id)?.name || ''
                    setForm((f) => ({ ...f, state: nm, district: '', tehsil: '' }))
                  }}>
                  <option value=''>{isHindi ? 'राज्य चुनें' : 'Select state'}</option>
                  {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{isHindi ? 'ज़िला' : 'District'} *</label>
                <select className={inputCls} value={districtId} disabled={!stateId}
                  onChange={(e) => {
                    const id = e.target.value
                    setDistrictId(id)
                    const nm = districts.find((d) => d.id === id)?.name || ''
                    setForm((f) => ({ ...f, district: nm, tehsil: '' }))
                  }}>
                  <option value=''>{isHindi ? 'ज़िला चुनें' : 'Select district'}</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{isHindi ? 'तहसील' : 'Tehsil'}</label>
                <select className={inputCls} value={form.tehsil} disabled={!districtId}
                  onChange={(e) => setForm((f) => ({ ...f, tehsil: e.target.value }))}>
                  <option value=''>{isHindi ? 'तहसील चुनें' : 'Select tehsil'}</option>
                  {tehsils.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{isHindi ? 'गाँव' : 'Village'}</label>
                <input className={inputCls} value={form.village} onChange={set('village')} maxLength={128}
                  placeholder={isHindi ? 'गाँव का नाम' : 'Village name'} />
              </div>
              <div>
                <label className={labelCls}>{isHindi ? 'पिन कोड' : 'Pincode'}</label>
                <input className={inputCls} value={form.pincode} onChange={set('pincode')} maxLength={6} inputMode='numeric'
                  placeholder='125053' />
              </div>
            </div>

            {/* Aadhaar card — optional */}
            <div>
              <label className={labelCls}>{isHindi ? 'आधार कार्ड' : 'Aadhaar card'} <span className='font-normal text-gray-400'>({isHindi ? 'वैकल्पिक — फ़ोटो या PDF' : 'optional — photo or PDF'})</span></label>
              <label className={fileCls}>
                <FileText className='h-5 w-5' />
                {aadhaar ? aadhaar.name : (isHindi ? 'आधार कार्ड अपलोड करें' : 'Upload Aadhaar card')}
                <input
                  type='file' accept='image/*,application/pdf' className='hidden'
                  onChange={(e) => setAadhaar(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {/* Photos — optional (max 5) */}
            <div>
              <label className={labelCls}>{isHindi ? 'फ़ोटो' : 'Photos'} <span className='font-normal text-gray-400'>({isHindi ? 'वैकल्पिक, अधिकतम 5' : 'optional, max 5'})</span></label>
              <label className={fileCls}>
                <ImagePlus className='h-5 w-5' />
                {images.length ? `${images.length} ${isHindi ? 'फ़ोटो चुनी गईं' : 'photo(s) selected'}` : (isHindi ? 'फ़ोटो जोड़ें' : 'Add photos')}
                <input
                  type='file' accept='image/*' multiple className='hidden'
                  onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))}
                />
              </label>
            </div>

            {/* Resume — optional */}
            <div>
              <label className={labelCls}>{isHindi ? 'रिज़्यूमे / CV' : 'Resume / CV'} <span className='font-normal text-gray-400'>({isHindi ? 'वैकल्पिक' : 'optional'})</span></label>
              <label className={fileCls}>
                <FileText className='h-5 w-5' />
                {resume ? resume.name : (isHindi ? 'रिज़्यूमे अपलोड करें' : 'Upload resume')}
                <input
                  type='file' accept='image/*,application/pdf' className='hidden'
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
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

          </div>{/* end right column */}
        </div>{/* end flex */}
      </section>
    </div>
  )
}
