'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { api } from '../../lib/api'
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
} from 'lucide-react'

const PRICE_UNITS = [
  { key: 'per_kg', label: 'per kg' },
  { key: 'per_quintal', label: 'per quintal' },
  { key: 'per_piece', label: 'per piece' },
  { key: 'per_litre', label: 'per litre' },
]

export default function SellPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [images, setImages] = useState([])
  const [categoryTree, setCategoryTree] = useState([])
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
      errors.quantity = 'Area (in acres) is required for Land / Property listings'
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
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
      if (form.mobile) formData.append('mobile', form.mobile)
      if (form.email) formData.append('email', form.email)

      images.forEach((dataUrl, i) => {
        const byteString = atob(dataUrl.split(',')[1])
        const mime = dataUrl.split(',')[0].split(':')[1].split(';')[0]
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j)
        const blob = new Blob([ab], { type: mime })
        formData.append('images', blob, `product-image-${i}.jpg`)
      })

      await api.createProduct(formData, token)
      setSuccess('Your product has been listed successfully!')
      setTimeout(() => router.push('/marketplace'), 1200)
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
            {success && <div className='rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700'>{success}</div>}

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
                    setForm({ ...form, category: val, quantityUnit: isLand ? 'acre' : form.quantityUnit })
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
                <label className='mb-1 block text-sm font-medium text-gray-700'>Price *</label>
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
                    placeholder='0.00'
                  />
                </div>
                {fieldErrors.price && <p className='mt-1 text-xs text-red-600'>{fieldErrors.price}</p>}
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>Price Unit *</label>
                <select
                  ref={(el) => (fieldRefs.current['priceUnit'] = el)}
                  value={form.priceUnit}
                  onChange={(e) => { setForm({ ...form, priceUnit: e.target.value }); clearFieldError('priceUnit') }}
                  className={`w-full rounded-lg border bg-white py-2.5 px-4 text-sm outline-none focus:ring-1 ${fieldErrors.priceUnit ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'}`}
                >
                  {PRICE_UNITS.map((u) => (
                    <option key={u.key} value={u.key}>{u.label}</option>
                  ))}
                </select>
                {fieldErrors.priceUnit && <p className='mt-1 text-xs text-red-600'>{fieldErrors.priceUnit}</p>}
              </div>
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  {isLandCategory ? 'Area (in acres) *' : 'Quantity'}
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
                {isLandCategory && (
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
                <input
                  type='text'
                  value={form.quantityUnit}
                  onChange={(e) => setForm({ ...form, quantityUnit: e.target.value })}
                  className={inputClass}
                  placeholder={isLandCategory ? 'acre' : 'kg / piece / litre'}
                  readOnly={isLandCategory}
                />
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
                  {locating ? 'Detecting...' : 'Use my current location'}
                </button>
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
                <label className='mb-1 block text-sm font-medium text-gray-700'>Mobile</label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input
                    type='tel'
                    pattern='[0-9]{10}'
                    maxLength={10}
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className='w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    placeholder='9876543210'
                  />
                </div>
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
