'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Headset, CheckCircle2 } from 'lucide-react'

/**
 * Service landing page — opens after the user picks a service (logged in)
 * or right after login/register when they came via a service card.
 * Placeholder until each service module is built; the selection is already
 * recorded in service_interest_history for the support team to follow up.
 */
function ServicePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceName = searchParams?.get('name') || 'Service'
  const [lang, setLang] = useState('en')
  const isHindi = lang === 'hi'

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='mx-auto max-w-3xl px-4 py-16 md:px-6'>
        <div className='rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-gray-100 md:p-12'>
          <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
            <CheckCircle2 className='h-8 w-8 text-emerald-600' />
          </div>
          <h1 className='text-2xl font-bold text-emerald-800 md:text-3xl'>{serviceName}</h1>
          <p className='mt-4 text-gray-600'>
            {isHindi
              ? 'आपकी सेवा का चयन दर्ज हो गया है। हमारी सहायता टीम जल्द ही आपसे संपर्क करेगी और इस सेवा का उपयोग करने में आपकी मदद करेगी।'
              : 'Your service selection has been recorded. Our support team will contact you shortly and guide you through using this service.'}
          </p>
          <div className='mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700'>
            <Headset className='h-5 w-5' />
            {isHindi ? 'सहायता टीम आपके पंजीकृत मोबाइल/ईमेल पर संपर्क करेगी' : 'Support team will reach you on your registered mobile/email'}
          </div>
          <button
            onClick={() => router.push('/')}
            className='mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700'
          >
            <ArrowLeft className='h-4 w-4' />
            {isHindi ? 'होम पर वापस जाएं' : 'Back to Home'}
          </button>
        </div>
      </section>

    </div>
  )
}

export default function ServicePage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-slate-50' />}>
      <ServicePageContent />
    </Suspense>
  )
}
