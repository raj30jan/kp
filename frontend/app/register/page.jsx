'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User, Phone, Mail, Lock, MapPin, ChevronRight, LocateFixed, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [lang, setLang] = useState('en')
  const isHindi = lang === 'hi'
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    state: '',
    district: '',
    city: '',
  })
  const [errors, setErrors] = useState({})
  const [location, setLocation] = useState(null) // { latitude, longitude }
  const [locStatus, setLocStatus] = useState('idle') // idle | loading | done | error
  const [locMessage, setLocMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Capture live GPS location via the browser Geolocation API (free, no key),
  // then reverse-geocode with OpenStreetMap Nominatim (free) to autofill address.
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('error')
      setLocMessage(isHindi ? 'इस ब्राउज़र में लोकेशन समर्थित नहीं है' : 'Geolocation not supported in this browser')
      return
    }
    setLocStatus('loading')
    setLocMessage('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation({ latitude, longitude })
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`,
          )
          const data = await res.json()
          const a = data?.address || {}
          setForm((f) => ({
            ...f,
            state: a.state || f.state,
            district: a.state_district || a.county || a.district || f.district,
            city: a.city || a.town || a.village || a.suburb || f.city,
          }))
          setLocStatus('done')
          setLocMessage(
            isHindi
              ? 'लोकेशन मिल गई — पता अपने आप भर गया'
              : 'Location detected — address auto-filled',
          )
        } catch {
          setLocStatus('done')
          setLocMessage(
            isHindi
              ? 'GPS मिल गया, पर पता नहीं मिला — कृपया हाथ से भरें'
              : 'GPS captured, but address lookup failed — please fill manually',
          )
        }
      },
      (err) => {
        setLocStatus('error')
        setLocMessage(
          err.code === 1
            ? isHindi
              ? 'लोकेशन की अनुमति नहीं मिली — कृपया ब्राउज़र में अनुमति दें'
              : 'Location permission denied — please allow it in the browser'
            : isHindi
              ? 'लोकेशन नहीं मिली — कृपया पता हाथ से भरें'
              : 'Could not get location — please fill address manually',
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = isHindi ? 'नाम आवश्यक है' : 'Name is required'
    if (!/^[0-9]{10}$/.test(form.mobile)) errs.mobile = isHindi ? '10 अंकों का मोबाइल नंबर दर्ज करें' : 'Enter 10-digit mobile number'
    // Email is REQUIRED — OTP is sent via email only until SMS gateway is integrated
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = isHindi ? 'मान्य ईमेल आवश्यक है — OTP ईमेल पर भेजा जाएगा' : 'Valid email is required — OTP will be sent to email'
    if (form.password.length < 6) errs.password = isHindi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) errs.confirmPassword = isHindi ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      // Simple register — no OTP until production go-live (OTP_REQUIRED=true re-enables it)
      const res = await api.register({
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        addressLine1: [form.city, form.district, form.state].filter(Boolean).join(', ') || 'Not provided',
        ...(location ? { latitude: location.latitude, longitude: location.longitude } : {}),
      })
      if (res?.token || res?.accessToken) {
        localStorage.setItem('kp_token', res.token || res.accessToken)
      }
      localStorage.setItem('kp_mobile', form.mobile)
      const service = new URLSearchParams(window.location.search).get('service')
      router.push(service ? `/service?name=${encodeURIComponent(service)}` : '/')
    } catch (err) {
      setSubmitError(
        err.message || (isHindi ? 'पंजीकरण विफल — पुनः प्रयास करें' : 'Registration failed — please try again'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='mx-auto max-w-2xl px-4 py-12 md:px-6'>
        <div className='rounded-3xl bg-white p-6 shadow-lg ring-1 ring-gray-100 md:p-10'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex items-center justify-center'>
              <Image
                src='/logo.png'
                alt='KisanPatrika — किसान पत्रिका'
                width={220}
                height={68}
                className='h-16 w-auto'
                priority
              />
            </div>
            <h1 className='text-2xl font-bold text-emerald-800 md:text-3xl'>
              {isHindi ? 'किसानपत्रिका पर पंजीकरण करें' : 'Register on KisanPatrika'}
            </h1>
            <p className='mt-2 text-sm text-gray-600'>
              {isHindi ? 'खाता बनाने के लिए अपनी जानकारी भरें' : 'Fill in your details to create an account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className='mt-8 space-y-5'>
            <div>
              <label className={labelClass}>{isHindi ? 'पूरा नाम' : 'Full Name'} *</label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <input type='text' name='name' value={form.name} onChange={handleChange} className={inputClass} placeholder={isHindi ? 'अपना नाम लिखें' : 'Enter your full name'} />
              </div>
              {errors.name && <p className='mt-1 text-xs text-red-500'>{errors.name}</p>}
            </div>

            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
              <div>
                <label className={labelClass}>{isHindi ? 'मोबाइल नंबर' : 'Mobile Number'} *</label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input type='tel' name='mobile' maxLength={10} value={form.mobile} onChange={handleChange} className={inputClass} placeholder='10-digit mobile' />
                </div>
                {errors.mobile && <p className='mt-1 text-xs text-red-500'>{errors.mobile}</p>}
              </div>

              <div>
                <label className={labelClass}>{isHindi ? 'ईमेल (OTP यहाँ भेजा जाएगा)' : 'Email (OTP will be sent here)'} *</label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input type='email' name='email' value={form.email} onChange={handleChange} className={inputClass} placeholder='email@example.com' />
                </div>
                {errors.email && <p className='mt-1 text-xs text-red-500'>{errors.email}</p>}
              </div>
            </div>

            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
              <div>
                <label className={labelClass}>{isHindi ? 'पासवर्ड' : 'Password'} *</label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input type='password' name='password' value={form.password} onChange={handleChange} className={inputClass} placeholder='******' />
                </div>
                {errors.password && <p className='mt-1 text-xs text-red-500'>{errors.password}</p>}
              </div>

              <div>
                <label className={labelClass}>{isHindi ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'} *</label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input type='password' name='confirmPassword' value={form.confirmPassword} onChange={handleChange} className={inputClass} placeholder='******' />
                </div>
                {errors.confirmPassword && <p className='mt-1 text-xs text-red-500'>{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className='border-t pt-4'>
              <div className='mb-3 flex items-center justify-between gap-3'>
                <p className='text-sm font-semibold text-gray-700'>
                  {isHindi ? 'पता जानकारी' : 'Address Information'}
                </p>
                <button
                  type='button'
                  onClick={detectLocation}
                  disabled={locStatus === 'loading'}
                  className='inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60'
                >
                  {locStatus === 'loading' ? (
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <LocateFixed className='h-3.5 w-3.5' />
                  )}
                  {isHindi ? 'मेरी लोकेशन पहचानें' : 'Detect My Location'}
                </button>
              </div>
              {locMessage && (
                <p
                  className={`mb-3 text-xs ${
                    locStatus === 'error' ? 'text-red-500' : 'text-emerald-600'
                  }`}
                >
                  {locMessage}
                  {location && (
                    <span className='ml-1 text-gray-400'>
                      ({location.latitude.toFixed(5)}, {location.longitude.toFixed(5)})
                    </span>
                  )}
                </p>
              )}
              <div className='grid grid-cols-1 gap-5 sm:grid-cols-3'>
                <div>
                  <label className={labelClass}>{isHindi ? 'राज्य' : 'State'}</label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' name='state' value={form.state} onChange={handleChange} className={inputClass} placeholder={isHindi ? 'राज्य' : 'State'} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{isHindi ? 'जिला' : 'District'}</label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' name='district' value={form.district} onChange={handleChange} className={inputClass} placeholder={isHindi ? 'जिला' : 'District'} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{isHindi ? 'शहर' : 'City'}</label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' name='city' value={form.city} onChange={handleChange} className={inputClass} placeholder={isHindi ? 'शहर' : 'City'} />
                  </div>
                </div>
              </div>
            </div>

            {submitError && (
              <p className='rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600'>
                {submitError}
              </p>
            )}

            <button
              type='submit'
              disabled={submitting}
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60'
            >
              {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
              {isHindi
                ? 'ईमेल पर ओटीपी भेजें और जारी रखें'
                : 'Send OTP to Email & Continue'}
              <ChevronRight className='h-4 w-4' />
            </button>

            <p className='text-center text-sm text-gray-600'>
              {isHindi ? 'पहले से खाता है? ' : 'Already have an account? '}
              <Link href='/login' className='font-semibold text-emerald-700 hover:underline'>
                {isHindi ? 'लॉग इन करें' : 'Login'}
              </Link>
            </p>
          </form>
        </div>
      </section>

    </div>
  )
}
