'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Phone, ShieldCheck, RefreshCw, Mail, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'

function VerifyOtpPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mobile = searchParams?.get('mobile') || ''
  const email = searchParams?.get('email') || ''
  const type = searchParams?.get('type') || 'register'
  const [lang, setLang] = useState('hi')
  const isHindi = lang === 'hi'
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(60)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const inputsRef = useRef([])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) {
      setError(isHindi ? '6 अंकों का OTP दर्ज करें' : 'Enter 6-digit OTP')
      return
    }
    setError('')
    setVerifying(true)
    try {
      await api.verifyOtp(mobile, code, email || undefined)
      // Remember mobile so service-interest records can be linked to this user
      localStorage.setItem('kp_mobile', mobile)
      // After login/registration, land on home page to pick a service
      router.push('/')
    } catch (err) {
      setError(
        err.message || (isHindi ? 'गलत या समाप्त OTP — पुनः प्रयास करें' : 'Invalid or expired OTP — please try again'),
      )
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      // Resend the same OTP to mobile + email
      await api.sendOtp(mobile, email || undefined)
      setOtp(['', '', '', '', '', ''])
      setTimer(60)
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(
        err.message || (isHindi ? 'OTP पुनः भेजने में समस्या' : 'Failed to resend OTP'),
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='mx-auto max-w-md px-4 py-12 md:px-6'>
        <div className='rounded-3xl bg-white p-6 shadow-lg ring-1 ring-gray-100 md:p-10'>
          <div className='text-center'>
            <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100'>
              <ShieldCheck className='h-7 w-7 text-emerald-700' />
            </div>
            <h1 className='text-2xl font-bold text-emerald-800'>
              {isHindi ? 'OTP सत्यापन' : 'OTP Verification'}
            </h1>
            <p className='mt-2 text-sm text-gray-600'>
              {isHindi
                ? 'हमने आपके ईमेल पर 6 अंकों का कोड भेजा है'
                : 'We sent a 6-digit code to your email'}
            </p>
            {email && (
              <p className='mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-gray-900'>
                <Mail className='h-4 w-4 text-blue-600' />
                {email}
              </p>
            )}
            <p className='mt-1 flex items-center justify-center gap-1 text-xs text-gray-500'>
              <Phone className='h-3.5 w-3.5 text-emerald-600' />
              +91 {mobile}
            </p>
          </div>

          <form onSubmit={handleVerify} className='mt-8 space-y-6'>
            <div className='flex justify-center gap-2'>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type='text'
                  inputMode='numeric'
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className='h-14 w-12 rounded-xl border-2 border-gray-200 text-center text-xl font-bold text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                />
              ))}
            </div>

            {error && <p className='text-center text-sm text-red-500'>{error}</p>}

            <button
              type='submit'
              disabled={verifying}
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60'
            >
              {verifying && <Loader2 className='h-4 w-4 animate-spin' />}
              {isHindi ? 'सत्यापित करें' : 'Verify OTP'}
            </button>

            <div className='text-center'>
              {timer > 0 ? (
                <p className='text-sm text-gray-500'>
                  {isHindi ? `पुनः भेजें ${timer} सेकंड में` : `Resend OTP in ${timer}s`}
                </p>
              ) : (
                <button
                  type='button'
                  onClick={handleResend}
                  disabled={resending}
                  className='inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-60'
                >
                  {resending ? <Loader2 className='h-3 w-3 animate-spin' /> : <RefreshCw className='h-3 w-3' />}
                  {isHindi ? 'OTP पुनः भेजें' : 'Resend OTP'}
                </button>
              )}
            </div>

            <p className='text-center text-sm text-gray-600'>
              <Link href={type === 'register' ? '/register' : '/login'} className='font-semibold text-emerald-700 hover:underline'>
                {isHindi ? 'वापस जाएं' : 'Go back'}
              </Link>
            </p>
          </form>
        </div>
      </section>

    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-slate-50' />}>
      <VerifyOtpPageContent />
    </Suspense>
  )
}
