'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'
import CategoryTreeSelect from '../components/CategoryTreeSelect'
import {
  Camera,
  ChevronDown,
  MapPin,
  Phone,
  Loader2,
  IndianRupee,
  Tag,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Video,
} from 'lucide-react'

// Fallback unit list — the backend's GET /marketplace/products/units is the
// source of truth and is fetched on mount; this mirrors it so the form still
// works if that call fails.
const FALLBACK_QUANTITY_UNITS = [
  { code: 'kg', en: 'Kilogram (kg)', hi: 'किलोग्राम', group: 'weight' },
  { code: 'quintal', en: 'Quintal (100 kg)', hi: 'क्विंटल', group: 'weight' },
  { code: 'ton', en: 'Ton (1000 kg)', hi: 'टन', group: 'weight' },
  { code: 'gram', en: 'Gram (g)', hi: 'ग्राम', group: 'weight' },
  { code: 'litre', en: 'Litre', hi: 'लीटर', group: 'volume' },
  { code: 'ml', en: 'Millilitre', hi: 'मिलीलीटर', group: 'volume' },
  { code: 'piece', en: 'Piece / Unit', hi: 'नग', group: 'count' },
  { code: 'dozen', en: 'Dozen', hi: 'दर्जन', group: 'count' },
  { code: 'bag', en: 'Bag', hi: 'बोरी', group: 'count' },
  { code: 'box', en: 'Box / Crate', hi: 'पेटी', group: 'count' },
  { code: 'bundle', en: 'Bundle', hi: 'बंडल', group: 'count' },
  { code: 'acre', en: 'Acre', hi: 'एकड़', group: 'area' },
  { code: 'bigha', en: 'Bigha', hi: 'बीघा', group: 'area' },
  { code: 'hectare', en: 'Hectare', hi: 'हेक्टेयर', group: 'area' },
  { code: 'kanal', en: 'Kanal', hi: 'कनाल', group: 'area' },
  { code: 'marla', en: 'Marla', hi: 'मरला', group: 'area' },
  { code: 'sqft', en: 'Square feet', hi: 'वर्ग फुट', group: 'area' },
  { code: 'sqyd', en: 'Square yard (gaj)', hi: 'वर्ग गज', group: 'area' },
]

const UNIT_GROUP_LABELS = {
  weight: { en: 'Weight', hi: 'वज़न' },
  volume: { en: 'Volume', hi: 'आयतन' },
  count: { en: 'Count / Packing', hi: 'संख्या / पैकिंग' },
  area: { en: 'Land Area', hi: 'भूमि क्षेत्र' },
}

const VIDEO_MAX_MB = 300 // client-side guard; server compresses to <=50MB

/** Group unit defs by their `group` key, preserving order. */
function groupUnits(units) {
  const groups = {}
  for (const u of units) (groups[u.group] = groups[u.group] || []).push(u)
  return Object.entries(groups)
}

const t = {
  en: {
    submittedTitle: 'Product submitted successfully!',
    submittedSub: 'Thank you for listing on KisanPatrika.',
    approvalTitle: 'Pending admin approval',
    approvalBody:
      'Your product will appear on the website after it is verified by our team — usually within a few hours.',
    membershipNote:
      'Free accounts can post up to 5 products. To sell more and to see buyer contact details, take a membership.',
    trackNote: 'You can track the approval status anytime in My Products.',
    viewMyProducts: 'View My Products',
    postAnother: 'Post Another Product',
  },
  hi: {
    submittedTitle: 'उत्पाद सफलतापूर्वक जमा हुआ!',
    submittedSub: 'किसानपत्रिका पर सूचीबद्ध करने के लिए धन्यवाद।',
    approvalTitle: 'एडमिन अनुमोदन लंबित',
    approvalBody:
      'हमारी टीम द्वारा सत्यापन के बाद आपका उत्पाद वेबसाइट पर दिखाई देगा — आमतौर पर कुछ घंटों में।',
    membershipNote:
      'मुफ्त खाते से केवल 5 उत्पाद बेचे जा सकते हैं। अधिक बेचने और खरीदार का संपर्क विवरण देखने के लिए मेंबरशिप लें।',
    trackNote: 'आप मेरे उत्पाद में कभी भी अनुमोदन की स्थिति देख सकते हैं।',
    viewMyProducts: 'मेरे उत्पाद देखें',
    postAnother: 'एक और उत्पाद जोड़ें',
  },
}

export default function SellPage() {
  const router = useRouter()
  const { lang } = useLang()
  const text = t[lang] || t.en
  const isHindi = lang === 'hi'
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [images, setImages] = useState([])
  const [video, setVideo] = useState(null) // File object
  const [categoryTree, setCategoryTree] = useState([])
  const [quantityUnits, setQuantityUnits] = useState(FALLBACK_QUANTITY_UNITS)
  const [locating, setLocating] = useState(false)

  const fieldRefs = useRef({})
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    priceUnit: 'per_kg',
    quantity: '',
    quantityUnit: 'kg',
    location: '',
    state: '',
    district: '',
    mobile: '',
    email: '',
    latitude: '',
    longitude: '',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('kp_token') || ''
      setToken(t)
      if (t) {
        api.getMe(t)
          .catch(() => {
            localStorage.removeItem('kp_token')
            localStorage.removeItem('kp_mobile')
            setToken('')
          })
      }
    }
    api.getCategoryTree()
      .then((res) => setCategoryTree(res?.tree || []))
      .catch(() => setCategoryTree([]))
    api.getUnits()
      .then((res) => { if (res?.quantityUnits?.length) setQuantityUnits(res.quantityUnits) })
      .catch(() => {})
  }, [])

  const isLandCategory = form.category === 'land' || form.category.startsWith('land-')

  const handleImageChange = (e) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).slice(0, 5 - images.length).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => setImages((prev) => [...prev, reader.result])
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setError(isHindi ? 'कृपया एक वीडियो फ़ाइल चुनें' : 'Please choose a video file')
      return
    }
    if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
      setError(isHindi ? `वीडियो ${VIDEO_MAX_MB}MB से छोटा होना चाहिए` : `Video must be under ${VIDEO_MAX_MB}MB — it will be compressed to 50MB on upload`)
      return
    }
    setError('')
    setVideo(file)
  }

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
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
          if (!res.ok) throw new Error('Could not fetch address from GPS coordinates')
          const data = await res.json()
          const a = data.address || {}
          const village = a.village || a.town || a.suburb || a.neighbourhood || ''
          const district = a.state_district || a.district || a.county || a.city || ''
          setForm((prev) => ({
            ...prev,
            location: data.display_name || (village ? `${village}, ${district || a.state || ''}` : ''),
            state: a.state || '',
            district,
            latitude: String(latitude),
            longitude: String(longitude),
          }))
        } catch (err) {
          setError(err.message || 'Failed to fetch address from your location.')
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        setError(err.message || 'Location permission denied or unavailable.')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const validateForm = () => {
    const errors = {}
    if (!form.title) {
      errors.title = 'Title is required'
    } else if (form.title.length < 3) {
      errors.title = 'Title must be at least 3 characters'
    }
    if (!form.category) {
      errors.category = 'Category is required'
    }
    if (form.price === '' || form.price === null || form.price === undefined) {
      errors.price = 'Price is required'
    } else if (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      errors.price = 'Price must be a valid number (0 or more)'
    }
    if (!form.priceUnit) {
      errors.priceUnit = 'Price unit is required'
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (isLandCategory && (form.quantity === '' || isNaN(parseFloat(form.quantity)) || parseFloat(form.quantity) <= 0)) {
      errors.quantity = 'Area is required for Land / Property listings'
    }
    // Mobile is mandatory for EVERY listing — buyers need a direct line to
    // the seller/owner, and the backend enforces the same rule.
    if (!/^[0-9]{10}$/.test(form.mobile)) {
      errors.mobile = isLandCategory
        ? 'Owner mobile number (10 digits) is required'
        : 'Seller mobile number (10 digits) is required'
    }
    return errors
  }

  const focusFirstError = (errors) => {
    const firstField = Object.keys(errors)[0]
    if (firstField && fieldRefs.current[firstField]) {
      fieldRefs.current[firstField].focus()
      fieldRefs.current[firstField].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const parseBackendErrors = (errMessage) => {
    const errors = {}
    const msg = errMessage || ''
    const parts = msg.split(', ').filter(Boolean)
    for (const part of parts) {
      if (part.includes('title')) errors.title = part.replace(/^title /, 'Title ')
      else if (part.includes('category')) errors.category = part.replace(/^category /, 'Category ')
      else if (part.includes('price ') || part.includes('price ')) errors.price = part.replace(/^price /, 'Price ')
      else if (part.includes('priceUnit')) errors.priceUnit = part.replace(/^priceUnit /, 'Price unit ')
      else if (part.includes('quantity')) errors.quantity = part.replace(/^quantity /, 'Quantity ')
      else if (part.includes('email')) errors.email = part.replace(/^email /, 'Email ')
      else if (part.includes('mobile')) errors.mobile = part.replace(/^mobile /, 'Mobile ')
      else if (part.includes('description')) errors.description = part.replace(/^description /, 'Description ')
    }
    return errors
  }

  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const resetForAnother = () => {
    setForm({
      title: '', description: '', category: '', price: '', priceUnit: 'per_kg',
      quantity: '', quantityUnit: 'kg', location: '', state: '', district: '',
      mobile: '', email: '', latitude: '', longitude: '',
    })
    setImages([])
    setVideo(null)
    setFieldErrors({})
    setSubmitted(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    if (!token) {
      setError('Please log in to post a product.')
      return
    }

    const clientErrors = validateForm()
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      focusFirstError(clientErrors)
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('category', form.category)
      formData.append('price', String(parseFloat(form.price)))
      formData.append('priceUnit', form.priceUnit)
      if (form.description) formData.append('description', form.description)
      if (form.quantity) formData.append('quantity', String(parseFloat(form.quantity)))
      if (form.quantityUnit) formData.append('quantityUnit', form.quantityUnit)
      if (form.location) formData.append('location', form.location)
      if (form.state) formData.append('state', form.state)
      if (form.district) formData.append('district', form.district)
      formData.append('mobile', form.mobile)
      if (form.email) formData.append('email', form.email)
      if (form.latitude) formData.append('latitude', String(parseFloat(form.latitude)))
      if (form.longitude) formData.append('longitude', String(parseFloat(form.longitude)))

      images.forEach((dataUrl, i) => {
        const byteString = atob(dataUrl.split(',')[1])
        const mime = dataUrl.split(',')[0].split(':')[1].split(';')[0]
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j)
        const blob = new Blob([ab], { type: mime })
        formData.append('images', blob, `product-image-${i}.jpg`)
      })
      if (video) formData.append('video', video, video.name || 'product-video.mp4')

      await api.createProduct(formData, token)
      // Product goes live only after admin approval — show the pending
      // panel instead of sending the seller to a marketplace where their
      // listing isn't visible yet.
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const backendErrors = parseBackendErrors(err.message)
      if (Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors)
        focusFirstError(backendErrors)
      } else {
        setError(err.message || 'Failed to list product.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

  return (
    <div className='min-h-screen bg-slate-50'>
      <main className='mx-auto max-w-3xl px-4 py-8 md:py-12'>
        {!token ? (
          <div className='rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-gray-100'>
            <h2 className='text-2xl font-bold text-emerald-800'>Please log in to sell</h2>
            <p className='mt-2 text-gray-600'>You need an account to post products.</p>
            <button
              onClick={() => router.push('/login?service=Sell Your Product')}
              className='mt-6 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
            >
              Login / Register
            </button>
          </div>
        ) : submitted ? (
          /* Post-submit: clear pending-approval notice so the seller knows
             the listing goes live only after the Kisan Patrika team reviews it. */
          <div className='rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-gray-100 md:p-12'>
            <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
              <CheckCircle2 className='h-9 w-9 text-emerald-600' />
            </div>
            <h2 className='text-2xl font-bold text-emerald-800'>{text.submittedTitle}</h2>
            <p className='mt-1 text-sm text-gray-500'>{text.submittedSub}</p>

            <div className='mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left'>
              <div className='flex items-center gap-2 text-sm font-semibold text-amber-800'>
                <ShieldCheck className='h-5 w-5 flex-shrink-0' />
                {text.approvalTitle}
              </div>
              <p className='mt-2 text-sm leading-relaxed text-amber-900/80'>{text.approvalBody}</p>
            </div>

            <div className='mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left'>
              <p className='text-sm leading-relaxed text-emerald-900/80'>{text.membershipNote}</p>
            </div>

            <p className='mt-4 text-xs text-gray-500'>{text.trackNote}</p>

            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={() => router.push('/my-products')}
                className='rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700'
              >
                {text.viewMyProducts}
              </button>
              <button
                onClick={resetForAnother}
                className='rounded-lg border border-emerald-600 px-6 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50'
              >
                {text.postAnother}
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className='space-y-6 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-gray-100 md:p-10'
          >
            <div>
              <h2 className='text-2xl font-bold text-emerald-800'>Post your product</h2>
              <p className='text-sm text-gray-500'>Fill the details below. Buyers will contact you directly.</p>
            </div>

            {error && (
              <div className='flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700'>
                <AlertCircle className='h-4 w-4 flex-shrink-0' />
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>Product Title *</label>
              <div className='relative'>
                <Tag className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <input
                  ref={(el) => (fieldRefs.current['title'] = el)}
                  required
                  type='text'
                  value={form.title}
                  onChange={(e) => { setForm({ ...form, title: e.target.value }); clearFieldError('title') }}
                  className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 ${fieldErrors.title ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                  placeholder='e.g. Fresh Organic Tomatoes'
                />
              </div>
              {fieldErrors.title && <p className='mt-1 text-xs text-red-600'>{fieldErrors.title}</p>}
            </div>

            {/* Category / Subcategory */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>Category / Subcategory *</label>
              <div className={fieldErrors.category ? 'ring-1 ring-red-200 rounded-lg' : ''}>
                <CategoryTreeSelect
                  tree={categoryTree}
                  value={form.category}
                  onChange={(val) => {
                    const isLand = val === 'land' || val.startsWith('land-')
                    setForm({
                      ...form,
                      category: val,
                      quantityUnit: isLand ? 'acre' : (form.quantityUnit === 'acre' ? 'kg' : form.quantityUnit),
                      priceUnit: isLand ? 'total' : (form.priceUnit === 'total' ? 'per_kg' : form.priceUnit),
                    })
                    clearFieldError('category')
                  }}
                  placeholder='Select category / subcategory'
                />
              </div>
              {fieldErrors.category && <p className='mt-1 text-xs text-red-600'>{fieldErrors.category}</p>}
            </div>

            {/* Price & Quantity */}
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  {isLandCategory ? 'Approx. Expected Price (₹) *' : 'Price *'}
                </label>
                <div className='relative'>
                  <IndianRupee className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input
                    ref={(el) => (fieldRefs.current['price'] = el)}
                    required
                    type='number'
                    min='0'
                    step='0.01'
                    value={form.price}
                    onChange={(e) => { setForm({ ...form, price: e.target.value }); clearFieldError('price') }}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 ${fieldErrors.price ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                    placeholder={isLandCategory ? 'e.g. 4500000' : '0.00'}
                  />
                </div>
                {isLandCategory && (
                  <p className='mt-1 text-xs text-gray-500'>Total expected price for the whole plot — buyers will negotiate.</p>
                )}
                {fieldErrors.price && <p className='mt-1 text-xs text-red-600'>{fieldErrors.price}</p>}
              </div>
              {!isLandCategory && (
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Price Unit *</label>
                  <select
                    ref={(el) => (fieldRefs.current['priceUnit'] = el)}
                    value={form.priceUnit}
                    onChange={(e) => { setForm({ ...form, priceUnit: e.target.value }); clearFieldError('priceUnit') }}
                    className={`w-full rounded-lg border bg-white py-2.5 px-4 text-sm outline-none focus:ring-1 ${fieldErrors.priceUnit ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                  >
                    <option value='total'>{isHindi ? 'कुल कीमत (पूरे लॉट)' : 'Total price (whole lot)'}</option>
                    {quantityUnits.map((u) => (
                      <option key={u.code} value={`per_${u.code}`}>
                        {isHindi ? `प्रति ${u.hi}` : `per ${u.en}`}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.priceUnit && <p className='mt-1 text-xs text-red-600'>{fieldErrors.priceUnit}</p>}
                </div>
              )}
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  {isLandCategory ? 'Area *' : 'Quantity'}
                </label>
                <input
                  ref={(el) => (fieldRefs.current['quantity'] = el)}
                  type='number'
                  min='0'
                  step='0.001'
                  value={form.quantity}
                  onChange={(e) => { setForm({ ...form, quantity: e.target.value }); clearFieldError('quantity') }}
                  className={`w-full rounded-lg border bg-white py-2.5 px-4 text-sm outline-none focus:ring-1 ${fieldErrors.quantity ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                  placeholder={isLandCategory ? 'e.g. 12.5' : 'e.g. 50'}
                />
                {isLandCategory && form.quantityUnit === 'acre' && (
                  <p className='mt-1 text-xs text-emerald-700'>
                    Listings over 10 acres are automatically highlighted as Large Land Parcels.
                  </p>
                )}
                {fieldErrors.quantity && <p className='mt-1 text-xs text-red-600'>{fieldErrors.quantity}</p>}
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  {isLandCategory ? 'Area Unit' : 'Quantity Unit'}
                </label>
                <select
                  value={form.quantityUnit}
                  onChange={(e) => setForm({ ...form, quantityUnit: e.target.value })}
                  className={inputClass}
                >
                  {groupUnits(isLandCategory ? quantityUnits.filter((u) => u.group === 'area') : quantityUnits).map(
                    ([group, units]) => (
                      <optgroup key={group} label={(isHindi ? UNIT_GROUP_LABELS[group]?.hi : UNIT_GROUP_LABELS[group]?.en) || group}>
                        {units.map((u) => (
                          <option key={u.code} value={u.code}>
                            {isHindi ? u.hi : u.en}
                          </option>
                        ))}
                      </optgroup>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className='w-full rounded-lg border border-gray-200 bg-white p-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                placeholder='Describe quality, freshness, delivery options...'
              />
            </div>

            {/* Location */}
            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='sm:col-span-3'>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Village / Location</label>
                <div className='relative'>
                  <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input
                    type='text'
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className='w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    placeholder='e.g. Village Rampur, Fatehabad'
                  />
                </div>
                <button
                  type='button'
                  onClick={handleDetectLocation}
                  disabled={locating}
                  className='mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50'
                >
                  {locating ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <MapPin className='h-4 w-4' />
                  )}
                  {locating ? 'Detecting...' : isLandCategory ? 'Add live location of land' : 'Use my current location'}
                </button>
                {form.latitude && form.longitude && (
                  <div className='mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800'>
                    <MapPin className='h-3.5 w-3.5 flex-shrink-0' />
                    <span>
                      GPS captured: {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=16/${form.latitude}/${form.longitude}`}
                      target='_blank'
                      rel='noreferrer'
                      className='font-semibold underline'
                    >
                      View on map
                    </a>
                    <button
                      type='button'
                      onClick={() => setForm({ ...form, latitude: '', longitude: '' })}
                      className='ml-auto text-emerald-600 hover:text-emerald-800'
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>State</label>
                <input
                  type='text'
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className={inputClass}
                  placeholder='Haryana'
                />
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>District</label>
                <input
                  type='text'
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className={inputClass}
                  placeholder='Fatehabad'
                />
              </div>
            </div>

            {/* Contact */}
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  {isLandCategory ? 'Owner Mobile *' : 'Seller Mobile *'}
                </label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input
                    ref={(el) => (fieldRefs.current['mobile'] = el)}
                    type='tel'
                    pattern='[0-9]{10}'
                    maxLength={10}
                    required
                    value={form.mobile}
                    onChange={(e) => { setForm({ ...form, mobile: e.target.value }); clearFieldError('mobile') }}
                    className={`w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 ${fieldErrors.mobile ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                    placeholder='9876543210'
                  />
                </div>
                {!fieldErrors.mobile && (
                  <p className='mt-1 text-xs text-gray-500'>
                    {isLandCategory
                      ? 'Buyers will contact the land owner on this number.'
                      : 'Buyers will contact you on this number. It is shown only to members.'}
                  </p>
                )}
                {fieldErrors.mobile && <p className='mt-1 text-xs text-red-600'>{fieldErrors.mobile}</p>}
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Email</label>
                <input
                  ref={(el) => (fieldRefs.current['email'] = el)}
                  type='email'
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); clearFieldError('email') }}
                  className={`w-full rounded-lg border bg-white py-2.5 px-4 text-sm outline-none focus:ring-1 ${fieldErrors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                  placeholder='seller@example.com'
                />
                {fieldErrors.email && <p className='mt-1 text-xs text-red-600'>{fieldErrors.email}</p>}
              </div>
            </div>

            {/* Video clip (optional) */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Video Clip (optional — up to {VIDEO_MAX_MB}MB, compressed to 50MB)
              </label>
              {video ? (
                <div className='flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3'>
                  <Video className='h-5 w-5 flex-shrink-0 text-emerald-600' />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-emerald-800'>{video.name}</p>
                    <p className='text-xs text-emerald-600'>{(video.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <button
                    type='button'
                    onClick={() => setVideo(null)}
                    className='rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200'
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className='flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-600'>
                  <Video className='h-5 w-5' />
                  <span>Add a short video of the product / land</span>
                  <input type='file' accept='video/*' className='hidden' onChange={handleVideoChange} />
                </label>
              )}
            </div>

            {/* Images */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>Product Images (up to 5)</label>
              <div className='flex flex-wrap gap-3'>
                {images.map((img, i) => (
                  <div key={i} className='relative h-24 w-24 overflow-hidden rounded-lg border'>
                    <img src={img} alt='preview' className='h-full w-full object-cover' />
                    <button
                      type='button'
                      onClick={() => removeImage(i)}
                      className='absolute right-0 top-0 rounded-bl bg-red-500 p-1 text-xs text-white'
                    >
                      ×
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className='flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-emerald-500 hover:text-emerald-600'>
                    <Camera className='h-6 w-6' />
                    <span className='mt-1 text-xs'>Add</span>
                    <input
                      type='file'
                      accept='image/*'
                      multiple
                      className='hidden'
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <button
              type='submit'
              disabled={loading}
              className='w-full rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50'
            >
              {loading ? (
                <span className='flex items-center justify-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' /> Posting...
                </span>
              ) : (
                'Post Product'
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
