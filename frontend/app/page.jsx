'use client'

import { useRouter } from 'next/navigation'
import HeroBanner from './components/HeroBanner'
import AnimalSection from './components/AnimalSection'
import LandShowcase from './components/LandShowcase'
import SellBuyPanel from './components/SellBuyPanel'
import ProductCategoryTiles from './components/ProductCategoryTiles'
import JobsServicesSection from './components/JobsServicesSection'
import CategoryProductRow from './components/CategoryProductRow'
import { MAIN_CATEGORIES } from '../lib/main-categories'
import {
  Bot,
  ArrowLeftRight,
  Plane,
  KeyRound,
  MapPin,
  HeartHandshake,
  HandCoins,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { api } from '../lib/api'
import { getSessionId } from '../lib/session'
import { useLang } from '../lib/lang-context'

const t = {
  en: {
    login: 'Login / Register',
    heroSlogan: 'KisanPatrika — Har Kisan Ki Apni Patrika',
    services: 'Farmer Support Services',
    servicesIntro: 'Finance, insurance, leasing and trade support — everything a farm needs beyond buying and selling.',
    shelves: 'Latest Listings',
  },
  hi: {
    login: 'लॉग इन / पंजीकरण',
    heroSlogan: 'किसानपत्रिका — हर किसान की अपनी पत्रिका',
    services: 'किसान सहायता सेवाएँ',
    servicesIntro: 'वित्त, बीमा, पट्टा और व्यापार सहायता — खरीद-बिक्री से आगे खेती की हर ज़रूरत।',
    shelves: 'नवीनतम सूचियाँ',
  },
}

// Support services shown ONCE on the homepage. Buying/selling, product
// categories, land, animals, and jobs/trades each have their own section
// above, so this grid holds only finance / insurance / lease / trade help.
const services = [
  {
    key: 'Lease',
    icon: KeyRound,
    en: { title: 'Lease Land & Equipment', desc: 'Lease out idle land or equipment, or take farmland on lease near you.' },
    hi: { title: 'भूमि व उपकरण पट्टा', desc: 'खाली ज़मीन या उपकरण पट्टे पर दें, या अपने पास खेती की ज़मीन पट्टे पर लें।' },
  },
  {
    key: 'Loan & Subsidy',
    icon: HandCoins,
    en: { title: 'Loans, Subsidy & Schemes', desc: 'PM-KISAN, KCC, state subsidies and bank loans — eligibility and applications.' },
    hi: { title: 'ऋण, सब्सिडी और योजनाएँ', desc: 'पीएम-किसान, केसीसी, राज्य सब्सिडी और बैंक ऋण — पात्रता और आवेदन।' },
  },
  {
    key: 'Fasal Bima',
    icon: ShieldCheck,
    serviceKey: 'FASAL_BIMA',
    en: { title: 'Fasal Bima (Crop Insurance)', desc: 'Protect your crops against drought, flood and pests under PMFBY.' },
    hi: { title: 'फसल बीमा', desc: 'PMFBY के तहत सूखा, बाढ़ और कीटों से अपनी फसल सुरक्षित करें।' },
  },
  {
    key: 'Export & Import',
    icon: Plane,
    en: { title: 'Export & Import', desc: 'Connect with exporters and importers; documentation and buyer matching.' },
    hi: { title: 'निर्यात और आयात', desc: 'निर्यातकों और आयातकों से जुड़ें; दस्तावेज़ और खरीदार मिलान।' },
  },
  {
    key: 'Barter',
    icon: ArrowLeftRight,
    en: { title: 'Barter Exchange', desc: 'Swap produce, seeds or equipment directly with other farmers.' },
    hi: { title: 'वस्तु विनिमय', desc: 'अन्य किसानों के साथ उपज, बीज या उपकरण की सीधी अदला-बदली करें।' },
  },
  {
    key: 'Membership',
    icon: HeartHandshake,
    href: '/membership',
    en: { title: 'Membership', desc: 'Unlock seller contacts, priority listings and expert support.' },
    hi: { title: 'सदस्यता', desc: 'विक्रेता संपर्क, प्राथमिकता सूची और विशेषज्ञ सहायता पाएँ।' },
  },
  {
    key: 'Our Stores',
    icon: MapPin,
    en: { title: 'Our Stores', desc: 'Find the nearest KisanPatrika support centre for in-person help.' },
    hi: { title: 'हमारे स्टोर', desc: 'व्यक्तिगत सहायता के लिए निकटतम किसानपत्रिका सहायता केंद्र खोजें।' },
  },
]

export default function HomePage() {
  const router = useRouter()
  const { lang } = useLang()
  const text = t[lang]

  const goToLogin = (service, serviceKey) => {
    // Record the selection for the support/calling team (guest or logged-in).
    // Fire-and-forget — never block navigation on tracking.
    const token = localStorage.getItem('kp_token')
    try {
      api.recordServiceInterest({
        sessionId: getSessionId(),
        serviceCode: (serviceKey || service || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
        serviceName: service,
        sourcePage: 'home',
        token: token || undefined,
        mobile: localStorage.getItem('kp_mobile') || undefined,
      }).catch(() => {})
    } catch {}
    // Logged in -> open the service page directly; guest -> login first
    if (token) {
      router.push(`/service?name=${encodeURIComponent(service)}`)
    } else {
      router.push(`/login?service=${encodeURIComponent(service)}`)
    }
  }

  // Route to a marketplace destination, gating guests through login first.
  const goMarketplace = (dest) => {
    const token = localStorage.getItem('kp_token')
    router.push(token ? dest : `/login?next=${encodeURIComponent(dest)}`)
  }

  // Tracked navigation for the big Sell/Buy, category and jobs tiles —
  // records the intent for the calling team, then routes (guests via login).
  const goTracked = (dest, code, name) => {
    try {
      api.recordServiceInterest({
        sessionId: getSessionId(),
        serviceCode: code,
        serviceName: name,
        sourcePage: 'home',
        token: localStorage.getItem('kp_token') || undefined,
        mobile: localStorage.getItem('kp_mobile') || undefined,
      }).catch(() => {})
    } catch {}
    goMarketplace(dest)
  }

  // Category tile / product card / "View all" / search-chip clicks all funnel
  // here. A product opens its detail page; a bare href opens that section.
  const openProduct = (product, fallbackHref) => {
    const dest = product ? `/marketplace/${product.id}` : fallbackHref
    if (!dest) return
    try {
      api.recordServiceInterest({
        sessionId: getSessionId(),
        serviceCode: product ? 'FEATURED_PRODUCT' : 'CATEGORY_VIEW',
        serviceName: product ? product.title : dest,
        sourcePage: 'home',
        token: localStorage.getItem('kp_token') || undefined,
        mobile: localStorage.getItem('kp_mobile') || undefined,
      }).catch(() => {})
    } catch {}
    goMarketplace(dest)
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <HeroBanner lang={lang} goToLogin={goToLogin} />

      {/* 1. SELL / BUY — the two primary actions, side by side, each with the
          same four asset types (products, animals, land, machines + rent). */}
      <SellBuyPanel lang={lang} onGo={goTracked} />

      {/* 2. Every buyable farm category as a big photo tile. */}
      <ProductCategoryTiles
        lang={lang}
        onSelect={(tile) => goTracked(tile.href, `CATEGORY_${tile.key.toUpperCase()}`, tile.en)}
      />

      {/* 3. Agriculture jobs & village trades — find or offer, plus one tile
          per service type (patwari, vet, labour, electrician, boring…). */}
      <JobsServicesSection
        lang={lang}
        onFind={() => goTracked('/services', 'FIND_SERVICE', 'Find a Service')}
        onOffer={() => goTracked('/services/new', 'OFFER_SERVICE', 'Offer Your Service')}
        onType={(key, name) => goTracked(`/services?type=${encodeURIComponent(key)}`, `SERVICE_${key.toUpperCase()}`, name)}
      />

      {/* 4. Live listings — ONE horizontally-scrolling shelf per category.
          Land and animals have dedicated sections below, and the broad Farm
          shelf excludes dairy so no listing appears in two rows. Rows
          self-hide when a category has no listings yet. */}
      <div className='mx-auto max-w-7xl px-4 pt-10 md:px-6'>
        <h2 className='text-center text-3xl font-bold text-gray-900 md:text-4xl'>{text.shelves}</h2>
      </div>
      {MAIN_CATEGORIES.filter((c) => c.row && c.key !== 'land' && c.key !== 'animals').map((cat, i) => (
        <div key={cat.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
          <CategoryProductRow
            title={lang === 'hi' && cat.hi ? cat.hi : cat.en}
            query={cat.row}
            excludeCategories={cat.rowExclude || []}
            viewAllHref={cat.href}
            lang={lang}
            onProductClick={openProduct}
          />
        </div>
      ))}

      {/* Land & Property — the only land section on the page. Self-hides when empty. */}
      <LandShowcase lang={lang} />

      {/* Animal Market — the only animal section on the page. Cards open the
          animals marketplace pre-filtered; the CTA lists an animal for sale. */}
      <AnimalSection
        lang={lang}
        onSelect={(a) =>
          goMarketplace(
            a.q
              ? `/marketplace?group=animals&q=${encodeURIComponent(a.q)}`
              : '/marketplace?group=animals'
          )
        }
        onSell={() => {
          const token = localStorage.getItem('kp_token')
          router.push(token ? '/sell-animal' : `/login?next=${encodeURIComponent('/sell-animal')}`)
        }}
      />

      {/* Farmer Services — non-product services only, each listed once with a
          short description of what the farmer actually gets. */}
      <section className='bg-slate-50 py-16'>
        <div className='mx-auto max-w-7xl px-4 md:px-6'>
          <div className='mb-10 text-center'>
            <h2 className='text-3xl font-bold text-gray-900'>{text.services}</h2>
            <p className='mx-auto mt-3 max-w-2xl text-gray-600'>{text.servicesIntro}</p>
          </div>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
            {services.map((s) => {
              const Icon = s.icon
              const copy = s[lang] || s.en
              return (
                <button
                  key={s.key}
                  onClick={() => {
                    if (s.href) {
                      const token = localStorage.getItem('kp_token')
                      router.push(token ? s.href : `/login?next=${encodeURIComponent(s.href)}`)
                    } else {
                      goToLogin(s.en.title, s.serviceKey || s.key)
                    }
                  }}
                  className='group flex items-start gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-200'
                >
                  <span className='shrink-0 rounded-xl bg-emerald-50 p-3 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white'>
                    <Icon className='h-6 w-6' />
                  </span>
                  <span className='min-w-0'>
                    <h3 className='text-base font-bold text-gray-900'>{copy.title}</h3>
                    <p className='mt-1 text-sm leading-relaxed text-gray-500'>{copy.desc}</p>
                    <span className='mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700'>
                      {lang === 'hi' ? 'और जानें' : 'Learn more'}
                      <ArrowRight className='h-4 w-4 transition group-hover:translate-x-0.5' />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Banner CTA */}
      <section className='bg-gradient-to-r from-emerald-800 to-green-700 py-16 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <h2 className='text-3xl font-bold md:text-4xl'>{text.heroSlogan}</h2>
          <p className='mx-auto mt-4 max-w-2xl text-emerald-100'>
            {lang === 'hi'
              ? 'किसानपत्रिका के साथ जुड़ें और खरीद, बिक्री, पट्टा, वित्त और जानकारी तक निःशुल्क पहुंच प्राप्त करें।'
              : 'Join KisanPatrika and get free access to buying, selling, leasing, finance, and information services.'}
          </p>
          <button
            onClick={() => router.push('/login')}
            className='mt-8 rounded-full bg-white px-8 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-50'
          >
            {text.login}
          </button>
        </div>
      </section>


      {/* Chatbot */}
      <button
        onClick={() => goToLogin('AI Assistant')}
        className='fixed bottom-6 right-6 z-50 rounded-full bg-emerald-600 p-4 text-white shadow-lg transition hover:scale-105 hover:bg-emerald-700'
        aria-label='AI Assistant'
      >
        <Bot className='h-6 w-6' />
      </button>
    </div>
  )
}
