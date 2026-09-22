'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Sprout, Phone, Lock, Globe, HelpCircle,
  ShoppingCart, Store, CloudRain, TrendingUp, HandCoins, MapPin,
} from 'lucide-react'
import { api, notifyAuthChanged } from '../../lib/api'

const freeServices = [
  { icon: TrendingUp, en: 'Daily Mandi Bhav', hi: 'दैनिक मंडी भाव' },
  { icon: HandCoins, en: 'Subsidy & Loan Schemes', hi: 'सब्सिडी और ऋण योजनाएँ' },
  { icon: CloudRain, en: 'Weather Forecast', hi: 'मौसम पूर्वानुमान' },
  { icon: MapPin, en: 'Store Locations', hi: 'स्टोर स्थान' },
  { icon: ShoppingCart, en: 'Free Product Listing', hi: 'मुफ्त उत्पाद सूची' },
  { icon: Store, en: 'Buyer-Seller Connect', hi: 'क्रेता-विक्रेता जोड़' },
]

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const service = searchParams?.get('service') || ''
  const next = searchParams?.get('next') || ''
  const [lang, setLang] = useState('en')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Step 2: after a correct password the backend emails an OTP and returns
  // a challengeId — we switch the form to OTP entry until verified.
  const [otpStep, setOtpStep] = useState(null) // { challengeId, email, devOtp? }
  const [otp, setOtp] = useState('')
  const isHindi = lang === 'hi'

  // After login, open the page the user wanted (service they clicked, or the
  // page they tried to jump to before being redirected here), else home
  const redirectTarget = service
    ? `/service?name=${encodeURIComponent(service)}`
    : next || '/'

  // Switching to Register must carry the same intent forward — otherwise a
  // guest who clicked a product/service and then chose "Register" would land
  // on home instead of back where they were headed.
  const registerParams = new URLSearchParams()
  if (service) registerParams.set('service', service)
  if (next) registerParams.set('next', next)
  const registerUrl = `/register${registerParams.size ? `?${registerParams}` : ''}`

  const finishLogin = (res) => {
    if (res?.token || res?.accessToken) {
      localStorage.setItem('kp_token', res.token || res.accessToken)
    }
    if (res?.user?.mobile) localStorage.setItem('kp_mobile', res.user.mobile)
    notifyAuthChanged('login')
    router.push(redirectTarget)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.login(email, password)
      if (res?.otpRequired) {
        // Password OK — now verify the emailed OTP.
        setOtpStep({ challengeId: res.challengeId, email: res.email, devOtp: res.devOtp })
        setOtp('')
        return
      }
      finishLogin(res)
    } catch (err) {
      setError(err.message || (isHindi ? 'गलत ईमेल या पासवर्ड' : 'Invalid email or password'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.verifyLoginOtp(otpStep.challengeId, otp.trim())
      finishLogin(res)
    } catch (err) {
      setError(err.message || (isHindi ? 'गलत या समाप्त OTP' : 'Invalid or expired OTP'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    try {
      const res = await api.resendLoginOtp(otpStep.challengeId)
      setOtpStep({ challengeId: res.challengeId, email: res.email, devOtp: res.devOtp })
      setOtp('')
    } catch (err) {
      setError(err.message || 'Could not resend OTP')
    }
  }

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='relative overflow-hidden bg-emerald-900 text-white'>
        <div className='absolute inset-0'>
          <Image
            src='https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80'
            alt='Indian farmers'
            fill
            className='object-cover opacity-25'
            sizes='100vw'
            unoptimized
          />
          <div className='absolute inset-0 bg-gradient-to-r from-emerald-950/90 to-emerald-800/60' />
        </div>
        <div className='relative mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20'>
          <div className='mx-auto max-w-xl rounded-3xl bg-white/95 p-6 text-gray-900 shadow-2xl backdrop-blur md:p-10'>
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
                {isHindi ? 'किसानपत्रिका में आपका स्वागत है' : 'Welcome to KisanPatrika'}
              </h1>
              <p className='mt-2 text-sm text-gray-600'>
                {isHindi ? 'सेवाओं का उपयोग करने के लिए लॉग इन करें या पंजीकरण करें' : 'Login or register to access services'}
              </p>
            </div>

            {service && (
              <div className='mt-4 rounded-lg bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700'>
                {isHindi ? 'सेवा' : 'Service'}: {decodeURIComponent(service)}
              </div>
            )}

            <div className='mt-6 flex rounded-lg bg-gray-100 p-1'>
              <button
                type='button'
                className='flex-1 rounded-md bg-white py-2 text-sm font-semibold text-emerald-700 shadow-sm transition'
              >
                {isHindi ? 'लॉग इन' : 'Login'}
              </button>
              <button
                type='button'
                onClick={() => router.push(registerUrl)}
                className='flex-1 rounded-md py-2 text-sm font-semibold text-gray-500 transition hover:text-emerald-700'
              >
                {isHindi ? 'पंजीकरण' : 'Register'}
              </button>
            </div>

            {otpStep ? (
              <form onSubmit={handleVerifyOtp} className='mt-6 space-y-4'>
                {error && (
                  <div className='rounded-lg bg-red-50 p-3 text-sm text-red-700'>{error}</div>
                )}
                <div className='rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800'>
                  {isHindi
                    ? `आपके ईमेल ${otpStep.email || ''} पर 6-अंकों का कोड भेजा गया है।`
                    : `A 6-digit code has been emailed to ${otpStep.email || 'your registered email'}.`}
                </div>
                {otpStep.devOtp && (
                  <div className='rounded-lg bg-amber-50 p-3 font-mono text-sm text-amber-800'>
                    Dev OTP: <strong>{otpStep.devOtp}</strong>
                  </div>
                )}
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>
                    {isHindi ? 'OTP कोड' : 'OTP Code'}
                  </label>
                  <input
                    type='text' required inputMode='numeric' pattern='[0-9]{6}' maxLength={6}
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className='w-full rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-center text-lg font-bold tracking-[0.5em] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    placeholder='••••••'
                  />
                </div>
                <button type='submit' disabled={submitting} className='w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50'>
                  {submitting ? (isHindi ? 'सत्यापित हो रहा है…' : 'Verifying…') : (isHindi ? 'सत्यापित करें और लॉग इन करें' : 'Verify & Login')}
                </button>
                <div className='flex items-center justify-between text-sm'>
                  <button type='button' onClick={() => { setOtpStep(null); setOtp(''); setError('') }} className='text-gray-500 hover:text-gray-700'>
                    {isHindi ? '← वापस' : '← Back'}
                  </button>
                  <button type='button' onClick={handleResendOtp} className='font-semibold text-emerald-700 hover:underline'>
                    {isHindi ? 'कोड दोबारा भेजें' : 'Resend code'}
                  </button>
                </div>
              </form>
            ) : (
            <form onSubmit={handleLogin} className='mt-6 space-y-4'>
              {error && (
                <div className='rounded-lg bg-red-50 p-3 text-sm text-red-700'>{error}</div>
              )}
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  {isHindi ? 'ईमेल' : 'Email'}
                </label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input
                    type='email' required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className='w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    placeholder={isHindi ? 'आपका ईमेल' : 'Your email address'}
                  />
                </div>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>
                  {isHindi ? 'पासवर्ड' : 'Password'}
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input
                    type='password' required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className='w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    placeholder='******'
                  />
                </div>
              </div>
              <button type='submit' disabled={submitting} className='w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50'>
                {submitting ? (isHindi ? 'लॉग इन हो रहा है…' : 'Logging in…') : (isHindi ? 'लॉग इन करें' : 'Login')}
              </button>
              <p className='text-center text-sm text-gray-600'>
                {isHindi ? 'खाता नहीं है? ' : "Don't have an account? "}
                <button type='button' onClick={() => router.push(registerUrl)} className='font-semibold text-emerald-700 hover:underline'>
                  {isHindi ? 'पंजीकरण करें' : 'Register here'}
                </button>
              </p>
            </form>
            )}
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-14 md:px-6'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
            <h2 className='mb-4 text-2xl font-bold text-emerald-800'>
              {isHindi ? 'किसानपत्रिका क्यों?' : 'Why KisanPatrika?'}
            </h2>
            <p className='text-sm leading-relaxed text-gray-600'>
              {isHindi
                ? 'किसानपत्रिका किसानों, व्यापारियों, निर्यातकों और सेवा प्रदाताओं को एक ही मंच पर लाती है। यहाँ आप मंडी भाव, सरकारी योजनाएँ, मौसम पूर्वानुमान, और खरीद-बिक्री सेवाएँ मुफ्त और सुरक्षित रूप से उपयोग कर सकते हैं।'
                : 'KisanPatrika brings farmers, traders, exporters, and service providers onto one platform. Here you can access mandi rates, government schemes, weather forecasts, and buying/selling services for free and securely.'}
            </p>
            <ul className='mt-4 space-y-2 text-sm text-gray-700'>
              <li className='flex items-center gap-2'><Lock className='h-4 w-4 text-emerald-600' />{isHindi ? 'सुरक्षित लेन-देन' : 'Secure transactions'}</li>
              <li className='flex items-center gap-2'><Globe className='h-4 w-4 text-emerald-600' />{isHindi ? 'अंतर्राष्ट्रीय बाजार पहुंच' : 'International market access'}</li>
              <li className='flex items-center gap-2'><HelpCircle className='h-4 w-4 text-emerald-600' />{isHindi ? '24/7 किसान सहायता' : '24/7 farmer support'}</li>
            </ul>
          </div>
          <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
            <h2 className='mb-4 text-2xl font-bold text-emerald-800'>
              {isHindi ? 'मुफ्त सेवाएँ' : 'Free Services'}
            </h2>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {freeServices.map((s) => {
                const Icon = s.icon
                const label = isHindi ? s.hi : s.en
                return (
                  <div key={s.en} className='flex items-center gap-3 rounded-xl bg-slate-50 p-3'>
                    <span className='rounded-lg bg-emerald-100 p-2 text-emerald-700'><Icon className='h-4 w-4' /></span>
                    <span className='text-sm font-medium text-gray-700'>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-slate-50' />}>
      <LoginPageContent />
    </Suspense>
  )
}
