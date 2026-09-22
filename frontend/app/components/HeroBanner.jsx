'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { API_BASE } from '../../lib/api'
import {
  ShoppingCart,
  Bot,
  CloudSun,
  TrendingUp,
  Landmark,
  Stethoscope,
  Building2,
  HardHat,
  HandCoins,
  Plane,
  Tractor,
  Shield,
  CheckCircle,
  Lock,
  Headphones,
  UserPlus,
  Store,
  Sparkles,
  Users,
  Package,
  MapPin,
  Globe,
  LayoutGrid,
} from 'lucide-react'

const t = {
  en: {
    tagline: 'किसान का साथी, किसान की तरक्की',
    trusted: 'Trusted by Millions of Farmers Across India',
    title: "India's AI Powered Digital Agriculture Ecosystem",
    subtitle: 'One Platform. Every Farmer. Every Service.',
    register: 'Register Free',
    marketplace: 'Explore Marketplace',
    askAi: 'Ask AI',
    easy: 'Easy to Use',
    verified: 'Verified Users',
    secure: 'Secure & Safe',
    support: '24x7 Support',
    statLabels: {
      farmers: 'Farmers',
      buyers: 'Buyers',
      products: 'Products',
      districts: 'Districts',
      languages: 'Languages',
      ai: 'AI Support',
      services: 'Services',
    },
  },
  hi: {
    tagline: 'किसान का साथी, किसान की तरक्की',
    trusted: 'भारत भर के करोड़ों किसानों का भरोसा',
    title: 'भारत का AI संचालित डिजिटल कृषि इकोसिस्टम',
    subtitle: 'एक मंच। हर किसान। हर सेवा।',
    register: 'मुफ्त पंजीकरण',
    marketplace: 'मार्केटप्लेस देखें',
    askAi: 'AI से पूछें',
    easy: 'आसान उपयोग',
    verified: 'सत्यापित उपयोगकर्ता',
    secure: 'सुरक्षित और सुरक्षित',
    support: '24x7 सहायता',
    statLabels: {
      farmers: 'किसान',
      buyers: 'खरीदार',
      products: 'उत्पाद',
      districts: 'जिले',
      languages: 'भाषाएँ',
      ai: 'AI सहायता',
      services: 'सेवाएँ',
    },
  },
}

const heroServices = [
  { en: 'Marketplace', hi: 'मार्केटप्लेस', icon: ShoppingCart },
  { en: 'AI Assistant', hi: 'AI सहायक', icon: Bot },
  { en: 'Weather', hi: 'मौसम', icon: CloudSun },
  { en: 'Mandi Bhav', hi: 'मंडी भाव', icon: TrendingUp },
  { en: 'Govt. Schemes', hi: 'सरकारी योजनाएँ', icon: Landmark },
  { en: 'Veterinary', hi: 'पशु चिकित्सा', icon: Stethoscope },
  { en: 'Land & Property', hi: 'भूमि और संपत्ति', icon: Building2 },
  { en: 'Hire Labour', hi: 'श्रमिक किराए पर', icon: HardHat },
  { en: 'Hire Machinery', hi: 'मशीन किराए पर', icon: Tractor },
  { en: 'Loans & Subsidy', hi: 'ऋण और सब्सिडी', icon: HandCoins },
  { en: 'Export & Import', hi: 'निर्यात और आयात', icon: Plane },
]

const phoneFeatures = [
  { en: 'Buyer', hi: 'खरीदार', icon: '🛒' },
  { en: 'Seller', hi: 'विक्रेत', icon: '🌾' },
  { en: 'Barter', hi: 'वसत्र विनिमय', icon: '🔄' },
  { en: 'Import', hi: 'आयात', icon: '📦' },
  { en: 'Export', hi: 'निर्यात', icon: '🌍' },
  { en: 'Lease', hi: 'पट्टा', icon: '🤝' },
  { en: 'Lessor', hi: 'पट्टादाता', icon: '🏡' },
  { en: 'Lessee', hi: 'पट्टाधारी', icon: '🏢' },
  { en: 'Labour', hi: 'श्रमिक', icon: '🚜' },
  { en: 'Transport', hi: 'परिवहन', icon: '🚚' },
  { en: 'Loan', hi: 'ऋण', icon: '💰' },
  { en: 'Subsidy', hi: 'सब्सिडी', icon: '🏦' },
  { en: 'Govt.', hi: 'सरकार', icon: '📜' },
  { en: 'Weather', hi: 'मौसम', icon: '🌦' },
  { en: 'Mandi', hi: 'मंडी', icon: '📈' },
]

export default function HeroBanner({ lang, goToLogin }) {
  const text = t[lang]
  const router = useRouter()
  const [live, setLive] = useState(null)

  // CTA buttons go straight to their destination — AppShell's auth guard
  // bounces guests to /login?next=<path> and brings them right back, so
  // no login plumbing is needed here.
  const goRegister = () => router.push('/register')

  // Live platform counters from the DB — replaces the old hardcoded
  // marketing numbers (10M+ / 500K+ / 2M+ …) with actual data.
  useEffect(() => {
    fetch(`${API_BASE}/stats/public`)
      .then((r) => r.json())
      .then(setLive)
      .catch(() => {})
  }, [])

  const fmt = (n) => (n == null ? '—' : n.toLocaleString('en-IN'))

  const stats = [
    { key: 'farmers', icon: Users, value: fmt(live?.farmers) },
    { key: 'buyers', icon: Users, value: fmt(live?.buyers) },
    { key: 'products', icon: Package, value: fmt(live?.products) },
    { key: 'districts', icon: MapPin, value: fmt(live?.districts) },
    { key: 'languages', icon: Globe, value: fmt(live?.languages) },
    { key: 'ai', icon: Headphones, value: '24x7' },
    { key: 'services', icon: LayoutGrid, value: '100+' },
  ]

  return (
    <section className='relative overflow-hidden bg-emerald-900 text-white'>
      <div className='absolute inset-0'>
        <Image
          src='https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80'
          alt='Indian farming family'
          fill
          className='object-cover opacity-35'
          sizes='100vw'
          unoptimized
        />
        <div className='absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-900/85 to-green-800/80' />
      </div>

      <div className='relative mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10'>
        {/* Main content */}
        <div className='mt-8 grid items-start gap-10 lg:grid-cols-2'>
          {/* Left column — desktop only; mobile shows just the phone mockup */}
          <div className='hidden space-y-6 lg:block'>
            <div>
              <h1 className='text-3xl font-extrabold leading-tight md:text-5xl'>
                {text.title}
              </h1>
              <p className='mt-3 text-xl font-semibold text-emerald-100 md:text-2xl'>
                {text.subtitle}
              </p>
            </div>

            {/* Service icons */}
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
              {heroServices.map((s) => {
                const Icon = s.icon
                const label = lang === 'hi' ? s.hi : s.en
                return (
                  <button
                    key={s.en}
                    onClick={() => goToLogin(s.en)}
                    className='group flex flex-col items-center rounded-2xl bg-white/10 p-3 text-center backdrop-blur transition hover:-translate-y-1 hover:bg-white/20'
                  >
                    <span className='rounded-full bg-emerald-100 p-2 text-emerald-700 transition group-hover:bg-amber-400 group-hover:text-emerald-900'>
                      <Icon className='h-5 w-5' />
                    </span>
                    <span className='mt-2 text-xs font-medium'>{label}</span>
                  </button>
                )
              })}
            </div>

            {/* CTAs */}
            <div className='flex flex-wrap gap-3'>
              <button
                onClick={goRegister}
                className='inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-emerald-900 transition hover:bg-amber-300'
              >
                <UserPlus className='h-4 w-4' />
                {text.register}
              </button>
              <button
                onClick={() => router.push('/marketplace')}
                className='inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500'
              >
                <Store className='h-4 w-4' />
                {text.marketplace}
              </button>
              <button
                onClick={() => router.push('/ai-assistant')}
                className='inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500'
              >
                <Sparkles className='h-4 w-4' />
                {text.askAi}
              </button>
            </div>

            {/* Trust badges */}
            <div className='flex flex-wrap gap-4 text-xs font-medium text-emerald-100'>
              <span className='flex items-center gap-1.5'>
                <CheckCircle className='h-4 w-4 text-amber-400' />
                {text.easy}
              </span>
              <span className='flex items-center gap-1.5'>
                <Shield className='h-4 w-4 text-amber-400' />
                {text.verified}
              </span>
              <span className='flex items-center gap-1.5'>
                <Lock className='h-4 w-4 text-amber-400' />
                {text.secure}
              </span>
              <span className='flex items-center gap-1.5'>
                <Headphones className='h-4 w-4 text-amber-400' />
                {text.support}
              </span>
            </div>
          </div>

          {/* Phone mockup — the only hero element on mobile */}
          <div className='flex flex-col items-center gap-4'>
            <div className='inline-flex items-center gap-2 rounded-full bg-amber-400/90 px-4 py-1.5 text-sm font-bold text-emerald-950 shadow-sm'>
              <Shield className='h-4 w-4' />
              {text.trusted}
            </div>
            <div className='w-full max-w-[320px] rounded-[2.5rem] border-[8px] border-emerald-900 bg-white p-2 shadow-2xl'>
              <div className='relative aspect-[9/18] overflow-hidden rounded-[2rem] bg-emerald-50 p-3 flex flex-col'>
                <div className='mb-2 flex items-center justify-between text-emerald-800'>
                  <span className='text-sm font-bold'>KisanPatrika</span>
                  <Bot className='h-4 w-4' />
                </div>
                <div className='grid flex-1 grid-cols-3 grid-rows-5 gap-1.5'>
                  {phoneFeatures.map((f) => {
                    const label = lang === 'hi' ? f.hi : f.en
                    return (
                      <button
                        key={f.en}
                        onClick={() => goToLogin(f.en)}
                        className='group flex h-full w-full flex-col items-center justify-center rounded-xl bg-white p-1.5 text-center shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-100'
                      >
                        <span className='text-lg'>{f.icon}</span>
                        <span className='mt-1 text-[11px] font-semibold leading-tight text-emerald-900'>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className='mt-2 rounded-xl bg-emerald-800 p-2 text-center text-[10px] text-white'>
                  {lang === 'hi'
                    ? 'AI सहायक से अपनी फसल, मौसम और बाज़ार कि जानकारी पाएँ।'
                    : 'Ask the AI assistant about crops, weather, and market prices.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar — desktop only */}
        <div className='mt-10 hidden grid-cols-2 gap-3 rounded-2xl bg-emerald-800/60 p-4 backdrop-blur sm:grid-cols-4 lg:grid lg:grid-cols-7'>
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.key}
                className='flex flex-col items-center justify-center gap-1 rounded-xl bg-emerald-900/40 p-3 text-center'
              >
                <Icon className='h-5 w-5 text-amber-400' />
                <p className='text-lg font-bold leading-none'>{s.value}</p>
                <p className='text-[10px] uppercase tracking-wide text-emerald-100'>{text.statLabels[s.key]}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
