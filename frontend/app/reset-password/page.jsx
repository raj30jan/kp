'use client'

import { useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') || ''
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(isHindi ? 'दोनों पासवर्ड मेल नहीं खाते' : 'Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError(isHindi ? 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए' : 'Password must be at least 8 characters')
      return
    }
    setSubmitting(true)
    try {
      await api.resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.message || (isHindi ? 'लिंक अमान्य या समाप्त है' : 'This link is invalid or has expired'))
    } finally {
      setSubmitting(false)
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
                  src={isHindi ? '/logo-hi.png' : '/logo-en.png'}
                  alt={isHindi ? 'किसानपत्रिका' : 'KisanPatrika'}
                  width={220}
                  height={73}
                  className='h-16 w-auto'
                  priority
                />
              </div>
              <h1 className='text-2xl font-bold text-emerald-800 md:text-3xl'>
                {isHindi ? 'नया पासवर्ड बनाएँ' : 'Set a new password'}
              </h1>
              <p className='mt-2 text-sm text-gray-600'>
                {isHindi ? 'अपने खाते के लिए एक नया पासवर्ड चुनें' : 'Choose a new password for your account'}
              </p>
            </div>

            {!token ? (
              <div className='mt-6 space-y-4'>
                <div className='flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800'>
                  <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0' />
                  <p>
                    {isHindi
                      ? 'यह लिंक अमान्य है। कृपया पासवर्ड रीसेट लिंक दोबारा माँगें।'
                      : 'This link is invalid. Please request a fresh password reset link.'}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => router.push('/forgot-password')}
                  className='w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700'
                >
                  {isHindi ? 'नया लिंक माँगें' : 'Request a new link'}
                </button>
              </div>
            ) : done ? (
              <div className='mt-6 space-y-4'>
                <div className='flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800'>
                  <CheckCircle className='mt-0.5 h-5 w-5 shrink-0' />
                  <div>
                    <p className='font-semibold'>
                      {isHindi ? 'पासवर्ड बदल दिया गया' : 'Password updated'}
                    </p>
                    <p className='mt-1'>
                      {isHindi
                        ? 'अब आप अपने नए पासवर्ड से लॉग इन कर सकते हैं।'
                        : 'You can now log in with your new password.'}
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => router.push('/login')}
                  className='w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700'
                >
                  {isHindi ? 'लॉग इन करें' : 'Go to login'}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className='mt-6 space-y-4'>
                {error && (
                  <div className='rounded-lg bg-red-50 p-3 text-sm text-red-700'>{error}</div>
                )}
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>
                    {isHindi ? 'नया पासवर्ड' : 'New password'}
                  </label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input
                      type='password' required minLength={8}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className='w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      placeholder={isHindi ? 'कम से कम 8 अक्षर' : 'At least 8 characters'}
                    />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>
                    {isHindi ? 'पासवर्ड दोबारा डालें' : 'Confirm password'}
                  </label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input
                      type='password' required minLength={8}
                      value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      className='w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      placeholder={isHindi ? 'वही पासवर्ड फिर से' : 'Repeat the same password'}
                    />
                  </div>
                </div>
                <button
                  type='submit' disabled={submitting}
                  className='w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50'
                >
                  {submitting
                    ? (isHindi ? 'सहेजा जा रहा है…' : 'Saving…')
                    : (isHindi ? 'पासवर्ड बदलें' : 'Update password')}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-slate-50' />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
