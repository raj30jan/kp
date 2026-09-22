'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowLeft, Headset, CheckCircle2 } from 'lucide-react'
import { useLang } from '../../lib/lang-context'

/**
 * Service landing page — opens after the user picks a service (logged in)
 * or right after login/register when they came via a service card.
 *
 * Services that already have a real page redirect straight there so every
 * entry point (/service?name=…, /login?service=…, service cards) lands on
 * the same canonical route. Services without a page yet fall through to
 * the placeholder below — the selection is already recorded in
 * service_interest_history for the support team to follow up.
 */

// Normalize a service name for lookup: lowercase, '&' → space, collapse
// punctuation/whitespace so "Seller", "Sellers", "sell your product" all match.
const normalize = (s) =>
  (s || '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()

// Every service name the UI can send (phone mockup, service grid, info cards)
// resolves to the closest real page — nothing falls through to the placeholder.
const SERVICE_ROUTES = {
  // --- Selling ---
  'seller': '/sell',
  'sellers': '/sell',
  'sell': '/sell',
  'sell product': '/sell',
  'sell your product': '/sell',

  // --- Buying / marketplace-type services ---
  'buyer': '/marketplace',
  'buyers': '/marketplace',
  'buy': '/marketplace',
  'buy sell': '/marketplace',
  'marketplace': '/marketplace',
  'barter': '/marketplace',
  'import': '/marketplace',
  'imports': '/marketplace',
  'importer': '/marketplace',
  'importers': '/marketplace',
  'export': '/marketplace',
  'exports': '/marketplace',
  'exporter': '/marketplace',
  'exporters': '/marketplace',
  'export import': '/marketplace',
  'participants': '/marketplace',
  'service providers': '/services',
  'service seekers': '/services',
  'services': '/services',
  'offer service': '/services/new',
  'offer your service': '/services/new',
  'labour': '/services?type=labour',
  'hire labour': '/services?type=labour',
  'hire machinery': '/services?type=machinery',
  'hire machinery jcb tractor combine drone': '/services?type=machinery',
  'machinery': '/services?type=machinery',
  'transport': '/services?type=transport',
  'patwari': '/services?type=patwari',
  'loan agent': '/services?type=loan_agent',
  'fertilisers pesticides': '/marketplace?category=fertilizers',
  'fertilizers pesticides': '/marketplace?category=fertilizers',
  'fertilizers': '/marketplace?category=fertilizers',

  // --- Land & leasing ---
  'land': '/marketplace?category=land',
  'land sale purchase': '/marketplace?category=land',
  'land property': '/marketplace?category=land',
  'lease': '/marketplace?category=land',
  'lease land equipment': '/marketplace?category=land',
  'lessor': '/marketplace?category=land',
  'lessors': '/marketplace?category=land',
  'lessee': '/marketplace?category=land',
  'lessees': '/marketplace?category=land',

  // --- Finance / government schemes ---
  'loan': '/schemes',
  'loans': '/schemes',
  'loans subsidy': '/schemes',
  'loan subsidy govt schemes': '/schemes',
  'subsidy': '/schemes',
  'govt': '/schemes',
  'govt schemes': '/schemes',
  'govt subsidy loans': '/schemes',
  'schemes': '/schemes',
  'finance': '/schemes',
  'fasal bima': '/schemes',
  'fasal bima crop insurance': '/schemes',
  'crop insurance': '/schemes',

  // --- Info / tools ---
  'mandi': '/mandi',
  'mandi rates': '/mandi',
  'mandi bhav': '/mandi',
  'weather': '/weather',
  'weather forecast': '/weather',
  'ai assistant': '/ai-assistant',
  'kisan jaankari': '/ai-assistant',
  'veterinary': '/services?type=veterinary',
  'vet': '/services?type=veterinary',
  'animal doctor': '/services?type=veterinary',

  // --- Membership & stores ---
  'membership': '/membership',
  'our membership': '/membership',
  'our stores': '/contact',
  'our store locations': '/contact',
  'store locations': '/contact',
}

function ServicePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceName = searchParams?.get('name') || 'Service'
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  // If this service already has a real page, go there — same purpose,
  // same route, no matter which link the user clicked.
  useEffect(() => {
    const dest = SERVICE_ROUTES[normalize(serviceName)]
    if (dest) router.replace(dest)
  }, [serviceName, router])

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
