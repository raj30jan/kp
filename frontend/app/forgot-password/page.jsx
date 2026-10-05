'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Mail, ArrowLeft, MailCheck } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.forgotPassword(email.trim())
      setDone(true)
    } catch (err) {
      setError(err.message || (isHindi ? 'कुछ गलत हो गया — दोबारा कोशिश करें' : 'Something went wrong — please try again'))
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
                {isHindi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
              </h1>
              <p className='mt-2 text-sm text-gray-600'>
                {isHindi
                  ? 'अपना ईमेल डालें — हम आपको पासवर्ड रीसेट करने का लिंक भेजेंगे'
                  : 'Enter your email — we will send you a link to reset your password'}
              </p>
            </div>

            {done ? (
              <div className='mt-6 space-y-4'>
                <div className='flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800'>
                  <MailCheck className='mt-0.5 h-5 w-5 shrink-0' />
                  <div>
                    <p className='font-semibold'>
                      {isHindi ? 'लिंक भेज दिया गया है' : 'Link sent'}
                    </p>
                    <p className='mt-1'>
                      {isHindi
                        ? `यदि ${email} के लिए खाता मौजूद है, तो पासवर्ड रीसेट लिंक ईमेल पर भेजा गया है। लिंक 30 मिनट के लिए मान्य है।`
                        : `If an account exists for ${email}, a reset link has been emailed. The link is valid for 30 minutes.`}
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => router.push('/login')}
                  className='w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700'
                >
                  {isHindi ? 'लॉग इन पर वापस जाएँ' : 'Back to login'}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className='mt-6 space-y-4'>
                {error && (
                  <div className='rounded-lg bg-red-50 p-3 text-sm text-red-700'>{error}</div>
                )}
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>
                    {isHindi ? 'पंजीकृत ईमेल' : 'Registered email'}
                  </label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input
                      type='email' required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className='w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      placeholder={isHindi ? 'आपका ईमेल' : 'Your email address'}
                    />
                  </div>
                </div>
                <button
                  type='submit' disabled={submitting}
                  className='w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50'
                >
                  {submitting
                    ? (isHindi ? 'भेजा जा रहा है…' : 'Sending…')
                    : (isHindi ? 'रीसेट लिंक भेजें' : 'Send reset link')}
                </button>
                <p className='text-center'>
                  <button
                    type='button'
                    onClick={() => router.push('/login')}
                    className='inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700'
                  >
                    <ArrowLeft className='h-3.5 w-3.5' />
                    {isHindi ? 'लॉग इन पर वापस' : 'Back to login'}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
