'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'
import {
  Camera,
  MapPin,
  Phone,
  Loader2,
  IndianRupee,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Video,
  PawPrint,
  Milk,
  Baby,
  X,
} from 'lucide-react'

const VIDEO_MAX_MB = 300
const MAX_IMAGES = 5

// Types that produce milk — milk capacity, lactation (ब्यात) and pregnancy
// fields only matter for these; hidden for meat/poultry/etc.
const DAIRY_CODES = new Set(['cow', 'buffalo', 'goat'])

const t = {
  en: {
    title: 'Sell Your Animal',
    subtitle: 'List your animal free — reach thousands of genuine buyers.',
    type: 'Animal Type *',
    breed: 'Breed / नस्ल',
    name: 'Listing Title *',
    namePh: 'e.g. Gir Cow — 12L/day, 2nd lactation',
    desc: 'Description',
    descPh: 'Health, feed, temperament, any documents…',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    age: 'Age',
    years: 'Years',
    months: 'Months',
    milk: 'Milk Capacity (litres/day)',
    lactation: 'Lactation / ब्यात (which calving)',
    pregnant: 'Is the animal pregnant?',
    yes: 'Yes',
    no: 'No',
    monthsPregnant: 'Months pregnant',
    price: 'Price (₹) *',
    negotiable: 'Price negotiable',
    photos: 'Photos',
    photosHint: `Up to ${MAX_IMAGES} photos — clear, front + side`,
    addPhoto: 'Add photo',
    video: 'Video (optional)',
    videoHint: 'A short clip helps it sell faster',
    location: 'Location',
    detect: 'Use my current location',
    detecting: 'Detecting…',
    village: 'Village / Area',
    state: 'State',
    district: 'District',
    mobile: 'Mobile Number *',
    email: 'Email (optional)',
    submit: 'Post Animal for Sale',
    posting: 'Posting…',
    loginRequired: 'Please log in to post your animal.',
    login: 'Log in to continue',
    myListings: 'My animal listings',
    success: 'Your animal has been submitted for approval.',
    successSub: 'It will go live once our team reviews it.',
    postAnother: 'Post another animal',
    required: 'This field is required',
    mobileErr: 'Enter a valid 10-digit mobile number',
    priceErr: 'Enter a valid price',
    typeErr: 'Choose the animal type',
  },
  hi: {
    title: 'अपना पशु बेचें',
    subtitle: 'अपना पशु मुफ्त सूचीबद्ध करें — हज़ारों असली खरीदारों तक पहुँचें।',
    type: 'पशु का प्रकार *',
    breed: 'नस्ल',
    name: 'लिस्टिंग शीर्षक *',
    namePh: 'जैसे: गिर गाय — 12ली/दिन, दूसरा ब्यात',
    desc: 'विवरण',
    descPh: 'सेहत, चारा, स्वभाव, दस्तावेज़…',
    gender: 'लिंग',
    male: 'नर',
    female: 'मादा',
    age: 'उम्र',
    years: 'साल',
    months: 'महीने',
    milk: 'दूध क्षमता (लीटर/दिन)',
    lactation: 'ब्यात (कौन सा ब्यात)',
    pregnant: 'क्या पशु गर्भित है?',
    yes: 'हाँ',
    no: 'नहीं',
    monthsPregnant: 'कितने महीने गर्भित',
    price: 'कीमत (₹) *',
    negotiable: 'कीमत में मोल-भाव',
    photos: 'फोटो',
    photosHint: `${MAX_IMAGES} तक फोटो — साफ़, आगे + बगल से`,
    addPhoto: 'फोटो जोड़ें',
    video: 'वीडियो (वैकल्पिक)',
    videoHint: 'छोटी क्लिप से पशु जल्दी बिकता है',
    location: 'लोकेशन',
    detect: 'मेरी वर्तमान लोकेशन लें',
    detecting: 'पता लग रहा है…',
    village: 'गाँव / क्षेत्र',
    state: 'राज्य',
    district: 'ज़िला',
    mobile: 'मोबाइल नंबर *',
    email: 'ईमेल (वैकल्पिक)',
    submit: 'पशु बिक्री के लिए डालें',
    posting: 'डाला जा रहा है…',
    loginRequired: 'पशु डालने के लिए लॉग इन करें।',
    login: 'जारी रखने के लिए लॉग इन करें',
    myListings: 'मेरे पशु',
    success: 'आपका पशु अनुमति के लिए भेजा गया है।',
    successSub: 'हमारी टीम की समीक्षा के बाद यह लाइव होगा।',
    postAnother: 'एक और पशु डालें',
    required: 'यह फ़ील्ड आवश्यक है',
    mobileErr: 'सही 10-अंकीय मोबाइल नंबर डालें',
    priceErr: 'सही कीमत डालें',
    typeErr: 'पशु का प्रकार चुनें',
  },
}

export default function SellAnimalPage() {
  const router = useRouter()
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const s = isHindi ? t.hi : t.en

  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [images, setImages] = useState([]) // [{ file, url }]
  const [video, setVideo] = useState(null)
  const [types, setTypes] = useState([])
  const [locating, setLocating] = useState(false)
  const fieldRefs = useRef({})

  const [form, setForm] = useState({
    animalTypeId: '',
    breedId: '',
    title: '',
    description: '',
    gender: 'female',
    ageYears: '',
    ageMonths: '',
    milkCapacity: '',
    lactationNumber: '',
    isPregnant: '0',
    monthsPregnant: '',
    price: '',
    isNegotiable: '1',
    mobile: '',
    email: '',
    location: '',
    state: '',
    district: '',
    latitude: '',
    longitude: '',
  })

  // Load token + animal types on mount.
  useEffect(() => {
    const tk = localStorage.getItem('kp_token') || ''
    setToken(tk)
    api
      .getAnimalTypes()
      .then((d) => setTypes(Array.isArray(d) ? d : d?.items || []))
      .catch(() => setTypes([]))
  }, [])

  const selectedType = types.find((x) => String(x.id) === String(form.animalTypeId))
  const breeds = selectedType?.breeds || []
  const isDairy =
    form.gender === 'female' && (selectedType ? DAIRY_CODES.has(selectedType.code) : true)

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  // --- images ---
  const handleImages = (e) => {
    const files = Array.from(e.target.files || [])
    const room = MAX_IMAGES - images.length
    files.slice(0, room).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      setImages((prev) => [...prev, { file, url }])
    })
    e.target.value = ''
  }
  const removeImage = (idx) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx]?.url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleVideo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setError(isHindi ? 'कृपया वीडियो फ़ाइल चुनें' : 'Please choose a video file')
      return
    }
    if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
      setError(`Video must be under ${VIDEO_MAX_MB}MB`)
      return
    }
    setError('')
    setVideo(file)
  }

  // --- geolocation → reverse-geocode to village/state/district ---
  const detectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }
    setLocating(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en-IN,en;q=0.9' } }
          )
          const data = await res.json()
          const a = data.address || {}
          const village = a.village || a.town || a.suburb || a.neighbourhood || ''
          const district = a.state_district || a.district || a.county || a.city || ''
          set({
            location: data.display_name || (village ? `${village}, ${district || a.state || ''}` : ''),
            state: a.state || '',
            district,
            latitude: String(latitude),
            longitude: String(longitude),
          })
        } catch {
          setError('Failed to fetch address from your location.')
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocating(false)
        setError('Location permission denied or unavailable.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const clearErr = (f) =>
    setFieldErrors((prev) => {
      if (!prev[f]) return prev
      const n = { ...prev }
      delete n[f]
      return n
    })

  const validate = () => {
    const er = {}
    if (!form.animalTypeId) er.animalTypeId = s.typeErr
    if (!form.title || form.title.trim().length < 3) er.title = s.required
    if (form.price === '' || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) er.price = s.priceErr
    if (!/^[0-9]{10}$/.test(form.mobile)) er.mobile = s.mobileErr
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = 'Invalid email'
    return er
  }

  const focusFirst = (er) => {
    const f = Object.keys(er)[0]
    const el = fieldRefs.current[f]
    if (el) {
      el.focus()
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const reset = () => {
    setForm({
      animalTypeId: '', breedId: '', title: '', description: '', gender: 'female',
      ageYears: '', ageMonths: '', milkCapacity: '', lactationNumber: '', isPregnant: '0',
      monthsPregnant: '', price: '', isNegotiable: '1', mobile: '', email: '',
      location: '', state: '', district: '', latitude: '', longitude: '',
    })
    setImages([])
    setVideo(null)
    setFieldErrors({})
    setSubmitted(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!token) {
      setError(s.loginRequired)
      return
    }
    const er = validate()
    if (Object.keys(er).length) {
      setFieldErrors(er)
      focusFirst(er)
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('animalTypeId', form.animalTypeId)
      if (form.breedId && form.breedId !== 'other') fd.append('breedId', form.breedId)
      fd.append('title', form.title.trim())
      if (form.description) fd.append('description', form.description)
      fd.append('gender', form.gender)
      if (form.ageYears !== '') fd.append('ageYears', String(parseInt(form.ageYears, 10)))
      if (form.ageMonths !== '') fd.append('ageMonths', String(parseInt(form.ageMonths, 10)))
      if (isDairy && form.milkCapacity !== '') fd.append('milkCapacity', String(parseFloat(form.milkCapacity)))
      if (isDairy && form.lactationNumber !== '') fd.append('lactationNumber', String(parseInt(form.lactationNumber, 10)))
      if (isDairy) {
        fd.append('isPregnant', form.isPregnant)
        if (form.isPregnant === '1' && form.monthsPregnant !== '')
          fd.append('monthsPregnant', String(parseInt(form.monthsPregnant, 10)))
      }
      fd.append('price', String(parseFloat(form.price)))
      fd.append('isNegotiable', form.isNegotiable)
      fd.append('mobile', form.mobile)
      if (form.email) fd.append('email', form.email)
      if (form.location) fd.append('location', form.location)
      if (form.state) fd.append('state', form.state)
      if (form.district) fd.append('district', form.district)
      if (form.latitude) fd.append('latitude', String(parseFloat(form.latitude)))
      if (form.longitude) fd.append('longitude', String(parseFloat(form.longitude)))
      images.forEach((img, i) => fd.append('images', img.file, img.file.name || `animal-${i}.jpg`))
      if (video) fd.append('video', video, video.name || 'animal-video.mp4')

      await api.createAnimal(fd, token)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Failed to list animal.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (f) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
      fieldErrors[f] ? 'border-red-400' : 'border-gray-300'
    }`

  // ---- login gate ----
  if (!token) {
    return (
      <div className='mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center'>
        <span className='rounded-full bg-emerald-100 p-4 text-emerald-700'>
          <PawPrint className='h-8 w-8' />
        </span>
        <h1 className='mt-4 text-2xl font-bold text-gray-900'>{s.title}</h1>
        <p className='mt-2 text-gray-600'>{s.loginRequired}</p>
        <button
          onClick={() => router.push(`/login?next=${encodeURIComponent('/sell-animal')}`)}
          className='mt-6 rounded-full bg-emerald-600 px-8 py-3 font-semibold text-white hover:bg-emerald-700'
        >
          {s.login}
        </button>
      </div>
    )
  }

  // ---- success panel ----
  if (submitted) {
    return (
      <div className='mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center'>
        <span className='rounded-full bg-emerald-100 p-4 text-emerald-700'>
          <CheckCircle2 className='h-10 w-10' />
        </span>
        <h1 className='mt-4 text-2xl font-bold text-gray-900'>{s.success}</h1>
        <p className='mt-2 text-gray-600'>{s.successSub}</p>
        <div className='mt-6 flex gap-3'>
          <button onClick={reset} className='rounded-full border border-emerald-600 px-6 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50'>
            {s.postAnother}
          </button>
          <button onClick={() => router.push('/my-animals')} className='rounded-full bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700'>
            {s.myListings}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-3xl px-4 py-8 md:px-6'>
      <button onClick={() => router.back()} className='mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-emerald-700'>
        <ArrowLeft className='h-4 w-4' /> {isHindi ? 'वापस' : 'Back'}
      </button>

      <div className='mb-6 flex items-center gap-3'>
        <span className='rounded-2xl bg-emerald-100 p-3 text-emerald-700'>
          <PawPrint className='h-7 w-7' />
        </span>
        <div>
          <h1 className='text-2xl font-extrabold text-gray-900 md:text-3xl'>{s.title}</h1>
          <p className='text-sm text-gray-600'>{s.subtitle}</p>
        </div>
      </div>

      {error && (
        <div className='mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
          <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' /> {error}
        </div>
      )}

      <form onSubmit={submit} className='space-y-6'>
        {/* Animal type — card picker */}
        <div>
          <label className='mb-2 block text-sm font-semibold text-gray-800'>{s.type}</label>
          <div className={`grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 ${fieldErrors.animalTypeId ? 'rounded-lg ring-1 ring-red-300 p-1' : ''}`}>
            {types.map((type) => {
              const active = String(form.animalTypeId) === String(type.id)
              return (
                <button
                  type='button'
                  key={type.id}
                  onClick={() => {
                    set({ animalTypeId: String(type.id), breedId: '' })
                    clearErr('animalTypeId')
                  }}
                  className={`rounded-xl border px-3 py-3 text-center text-sm font-semibold transition ${
                    active
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {isHindi && type.nameHi ? type.nameHi : type.name}
                </button>
              )
            })}
          </div>
          {fieldErrors.animalTypeId && <p className='mt-1 text-xs text-red-600'>{fieldErrors.animalTypeId}</p>}
        </div>

        {/* Breed (cascades from type) */}
        {breeds.length > 0 && (
          <div>
            <label className='mb-1 block text-sm font-semibold text-gray-800'>{s.breed}</label>
            <select
              value={form.breedId}
              onChange={(e) => set({ breedId: e.target.value })}
              className={inputCls('breedId')}
            >
              <option value=''>{isHindi ? 'नस्ल चुनें' : 'Select breed'}</option>
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {isHindi && b.nameHi ? b.nameHi : b.name}
                </option>
              ))}
              <option value='other'>{isHindi ? 'अन्य' : 'Other'}</option>
            </select>
          </div>
        )}

        {/* Title + description */}
        <div>
          <label className='mb-1 block text-sm font-semibold text-gray-800'>{s.name}</label>
          <input
            ref={(el) => (fieldRefs.current.title = el)}
            value={form.title}
            onChange={(e) => {
              set({ title: e.target.value })
              clearErr('title')
            }}
            placeholder={s.namePh}
            className={inputCls('title')}
          />
          {fieldErrors.title && <p className='mt-1 text-xs text-red-600'>{fieldErrors.title}</p>}
        </div>

        <div>
          <label className='mb-1 block text-sm font-semibold text-gray-800'>{s.desc}</label>
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
            placeholder={s.descPh}
            className={inputCls('description')}
          />
        </div>

        {/* Gender + age */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <label className='mb-1 block text-sm font-semibold text-gray-800'>{s.gender}</label>
            <div className='flex gap-2'>
              {[
                { v: 'female', l: s.female },
                { v: 'male', l: s.male },
              ].map((g) => (
                <button
                  type='button'
                  key={g.v}
                  onClick={() => set({ gender: g.v })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    form.gender === g.v
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                  }`}
                >
                  {g.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className='mb-1 block text-sm font-semibold text-gray-800'>{s.age}</label>
            <div className='flex gap-2'>
              <input
                type='number'
                min='0'
                max='40'
                value={form.ageYears}
                onChange={(e) => set({ ageYears: e.target.value })}
                placeholder={s.years}
                className={inputCls('ageYears')}
              />
              <input
                type='number'
                min='0'
                max='11'
                value={form.ageMonths}
                onChange={(e) => set({ ageMonths: e.target.value })}
                placeholder={s.months}
                className={inputCls('ageMonths')}
              />
            </div>
          </div>
        </div>

        {/* Dairy-only fields */}
        {isDairy && (
          <div className='rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4'>
            <div className='mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800'>
              <Milk className='h-4 w-4' /> {isHindi ? 'दूध और ब्यात की जानकारी' : 'Milk & lactation details'}
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>{s.milk}</label>
                <input
                  type='number'
                  min='0'
                  step='0.5'
                  value={form.milkCapacity}
                  onChange={(e) => set({ milkCapacity: e.target.value })}
                  placeholder='e.g. 12'
                  className={inputCls('milkCapacity')}
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>{s.lactation}</label>
                <input
                  type='number'
                  min='0'
                  max='20'
                  value={form.lactationNumber}
                  onChange={(e) => set({ lactationNumber: e.target.value })}
                  placeholder='e.g. 2'
                  className={inputCls('lactationNumber')}
                />
              </div>
            </div>
            <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  <Baby className='mr-1 inline h-4 w-4' />
                  {s.pregnant}
                </label>
                <div className='flex gap-2'>
                  {[
                    { v: '0', l: s.no },
                    { v: '1', l: s.yes },
                  ].map((p) => (
                    <button
                      type='button'
                      key={p.v}
                      onClick={() => set({ isPregnant: p.v })}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        form.isPregnant === p.v
                          ? 'border-emerald-600 bg-white text-emerald-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300'
                      }`}
                    >
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
              {form.isPregnant === '1' && (
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{s.monthsPregnant}</label>
                  <input
                    type='number'
                    min='0'
                    max='12'
                    value={form.monthsPregnant}
                    onChange={(e) => set({ monthsPregnant: e.target.value })}
                    placeholder='e.g. 5'
                    className={inputCls('monthsPregnant')}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price + negotiable */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <label className='mb-1 block text-sm font-semibold text-gray-800'>
              <IndianRupee className='mr-1 inline h-4 w-4' />
              {s.price}
            </label>
            <input
              ref={(el) => (fieldRefs.current.price = el)}
              type='number'
              min='0'
              step='0.01'
              value={form.price}
              onChange={(e) => {
                set({ price: e.target.value })
                clearErr('price')
              }}
              placeholder='e.g. 85000'
              className={inputCls('price')}
            />
            {fieldErrors.price && <p className='mt-1 text-xs text-red-600'>{fieldErrors.price}</p>}
          </div>
          <div className='flex items-end'>
            <label className='flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700'>
              <input
                type='checkbox'
                checked={form.isNegotiable === '1'}
                onChange={(e) => set({ isNegotiable: e.target.checked ? '1' : '0' })}
                className='h-4 w-4 accent-emerald-600'
              />
              {s.negotiable}
            </label>
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className='mb-1 block text-sm font-semibold text-gray-800'>{s.photos}</label>
          <p className='mb-2 text-xs text-gray-500'>{s.photosHint}</p>
          <div className='flex flex-wrap gap-3'>
            {images.map((img, i) => (
              <div key={i} className='relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200'>
                <Image src={img.url} alt='' fill className='object-cover' unoptimized />
                <button
                  type='button'
                  onClick={() => removeImage(i)}
                  className='absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80'
                  aria-label='Remove'
                >
                  <X className='h-3 w-3' />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className='flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-emerald-400 hover:text-emerald-600'>
                <Camera className='h-6 w-6' />
                <span className='mt-1 text-[10px] font-medium'>{s.addPhoto}</span>
                <input type='file' accept='image/*' multiple onChange={handleImages} className='hidden' />
              </label>
            )}
          </div>
        </div>

        {/* Video */}
        <div>
          <label className='mb-1 block text-sm font-semibold text-gray-800'>{s.video}</label>
          <p className='mb-2 text-xs text-gray-500'>{s.videoHint}</p>
          <label className='inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-emerald-400'>
            <Video className='h-5 w-5 text-emerald-600' />
            {video ? video.name : isHindi ? 'वीडियो चुनें' : 'Choose video'}
            <input type='file' accept='video/*' onChange={handleVideo} className='hidden' />
          </label>
        </div>

        {/* Location */}
        <div className='rounded-2xl border border-gray-100 bg-slate-50 p-4'>
          <div className='mb-3 flex items-center justify-between'>
            <label className='flex items-center gap-2 text-sm font-semibold text-gray-800'>
              <MapPin className='h-4 w-4 text-emerald-600' /> {s.location}
            </label>
            <button
              type='button'
              onClick={detectLocation}
              disabled={locating}
              className='inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60'
            >
              {locating ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <MapPin className='h-3.5 w-3.5' />}
              {locating ? s.detecting : s.detect}
            </button>
          </div>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder={s.village} className={inputCls('location')} />
            <input value={form.state} onChange={(e) => set({ state: e.target.value })} placeholder={s.state} className={inputCls('state')} />
            <input value={form.district} onChange={(e) => set({ district: e.target.value })} placeholder={s.district} className={inputCls('district')} />
          </div>
        </div>

        {/* Contact */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <div>
            <label className='mb-1 block text-sm font-semibold text-gray-800'>
              <Phone className='mr-1 inline h-4 w-4' />
              {s.mobile}
            </label>
            <input
              ref={(el) => (fieldRefs.current.mobile = el)}
              type='tel'
              maxLength={10}
              value={form.mobile}
              onChange={(e) => {
                set({ mobile: e.target.value.replace(/\D/g, '') })
                clearErr('mobile')
              }}
              placeholder='9876543210'
              className={inputCls('mobile')}
            />
            {fieldErrors.mobile && <p className='mt-1 text-xs text-red-600'>{fieldErrors.mobile}</p>}
          </div>
          <div>
            <label className='mb-1 block text-sm font-semibold text-gray-800'>{s.email}</label>
            <input
              type='email'
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder='you@example.com'
              className={inputCls('email')}
            />
            {fieldErrors.email && <p className='mt-1 text-xs text-red-600'>{fieldErrors.email}</p>}
          </div>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full rounded-full bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow transition hover:bg-emerald-700 disabled:opacity-60'
        >
          {loading ? (
            <span className='inline-flex items-center gap-2'>
              <Loader2 className='h-5 w-5 animate-spin' /> {s.posting}
            </span>
          ) : (
            s.submit
          )}
        </button>
      </form>
    </div>
  )
}
