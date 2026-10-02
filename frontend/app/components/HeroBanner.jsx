'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { API_BASE } from '../../lib/api'
import {
  ShoppingCart,
  PawPrint,
  Building2,
  HardHat,
  HandCoins,
  Plane,
  Tractor,
  Truck,
  Wheat,
  Shield,
  CheckCircle,
  Lock,
  Headphones,
  UserPlus,
  Store,
  Users,
  Package,
  MapPin,
  Globe,
  LayoutGrid,
  Signal,
  Wifi,
  BatteryFull,
  Bell,
  Home,
  User,
} from 'lucide-react'

const t = {
  en: {
    tagline: 'किसान का साथी, किसान की तरक्की',
    trusted: 'Trusted by Millions of Farmers Across India',
    title: "India's AI Powered Digital Agriculture Ecosystem",
    subtitle: 'One Platform. Every Farmer. Every Service.',
    register: 'Register Free',
    marketplace: 'Explore Marketplace',
    jobsServices: 'Jobs & Services',
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
    jobsServices: 'नौकरियाँ और सेवाएँ',
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

// Revenue-driving services only — free/government tools (weather, mandi
// rates, schemes, AI assistant) live in the footer. The same list renders
// the desktop icon strip and the phone mockup's service grid.
const heroServices = [
  { en: 'Marketplace', hi: 'मार्केटप्लेस', icon: ShoppingCart, href: '/marketplace', tile: 'bg-emerald-100 text-emerald-700' },
  { en: 'Hire Machinery', hi: 'मशीन किराए पर', icon: Tractor, href: '/marketplace?category=agri-machinery', tile: 'bg-amber-100 text-amber-700' },
  { en: 'Hire Labour', hi: 'श्रमिक किराए पर', icon: HardHat, href: '/services?type=labour', tile: 'bg-blue-100 text-blue-700' },
  { en: 'Veterinary', hi: 'पशु चिकित्सा', icon: PawPrint, href: '/services?type=veterinary', tile: 'bg-rose-100 text-rose-700' },
  { en: 'Land & Property', hi: 'भूमि और संपत्ति', icon: Building2, href: '/marketplace?group=land', tile: 'bg-violet-100 text-violet-700' },
  { en: 'Transport', hi: 'ट्रांसपोर्ट', icon: Truck, href: '/services?type=transport', tile: 'bg-orange-100 text-orange-700' },
  { en: 'Loans & Subsidy', hi: 'ऋण और सब्सिडी', icon: HandCoins, href: '/services?type=loan_agent', tile: 'bg-cyan-100 text-cyan-700' },
  { en: 'Export & Import', hi: 'निर्यात और आयात', icon: Plane, href: '/export-import', tile: 'bg-indigo-100 text-indigo-700' },
]

// Fake app bottom-nav inside the phone mockup — real routes, so every part
// of the "app screen" is tappable.
const phoneNav = [
  { en: 'Home', hi: 'होम', icon: Home, href: '/', active: true },
  { en: 'Market', hi: 'बाज़ार', icon: Store, href: '/marketplace' },
  { en: 'Services', hi: 'सेवाएँ', icon: LayoutGrid, href: '/services' },
  { en: 'Profile', hi: 'प्रोफ़ाइल', icon: User, href: '/login' },
]

export default function HeroBanner({ lang }) {
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
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              {heroServices.map((s) => {
                const Icon = s.icon
                const label = lang === 'hi' ? s.hi : s.en
                return (
                  <button
                    key={s.en}
                    onClick={() => router.push(s.href)}
                    className='group flex flex-col items-center rounded-2xl bg-white/10 p-3 text-center backdrop-blur transition hover:-translate-y-1 hover:bg-white/20'
                  >
                    <span className={`rounded-full p-2 transition group-hover:bg-amber-400 group-hover:text-emerald-900 ${s.tile}`}>
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
                onClick={() => router.push('/services')}
                className='inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500'
              >
                <Users className='h-4 w-4' />
                {text.jobsServices}
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
            {/* Phone frame — side buttons, bezel, punch-hole camera */}
            <div className='relative w-full max-w-[290px]'>
              <span className='absolute -right-[11px] top-24 h-14 w-[3px] rounded-r bg-emerald-950' />
              <span className='absolute -left-[11px] top-16 h-8 w-[3px] rounded-l bg-emerald-950' />
              <span className='absolute -left-[11px] top-28 h-12 w-[3px] rounded-l bg-emerald-950' />

              <div className='rounded-[2.75rem] border-[7px] border-emerald-950 bg-emerald-950 shadow-2xl'>
                <div className='relative flex aspect-[9/19] flex-col overflow-hidden rounded-[2.1rem] bg-gradient-to-b from-emerald-50 to-white'>
                  {/* punch-hole camera */}
                  <span className='absolute left-1/2 top-2 z-20 h-4 w-4 -translate-x-1/2 rounded-full bg-gray-900 shadow-inner' />

                  {/* status bar */}
                  <div className='flex items-center justify-between px-5 pt-2.5 text-[10px] font-semibold text-emerald-950'>
                    <span>9:41</span>
                    <span className='flex items-center gap-1'>
                      <Signal className='h-3 w-3' />
                      <Wifi className='h-3 w-3' />
                      <BatteryFull className='h-3 w-3' />
                    </span>
                  </div>

                  {/* app bar */}
                  <div className='mt-1.5 flex items-center justify-between px-3'>
                    <span className='flex items-center gap-1.5'>
                      <span className='rounded-full bg-emerald-600 p-1'>
                        <Wheat className='h-3.5 w-3.5 text-white' />
                      </span>
                      <span className='text-sm font-extrabold text-emerald-900'>KisanPatrika</span>
                    </span>
                    <Bell className='h-4 w-4 text-emerald-700' />
                  </div>

                  {/* services grid — the earning services live here */}
                  <p className='mt-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-700'>
                    {lang === 'hi' ? 'हमारी सेवाएँ' : 'Our Services'}
                  </p>
                  <div className='mx-3 mt-1.5 grid flex-1 grid-cols-2 grid-rows-4 gap-2'>
                    {heroServices.map((s) => {
                      const Icon = s.icon
                      const label = lang === 'hi' ? s.hi : s.en
                      return (
                        <button
                          key={s.en}
                          onClick={() => router.push(s.href)}
                          className='group flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl bg-white p-1.5 text-center shadow-sm ring-1 ring-emerald-100 transition active:scale-95'
                        >
                          <span className={`rounded-xl p-1.5 ${s.tile}`}>
                            <Icon className='h-4 w-4' />
                          </span>
                          <span className='text-[10px] font-semibold leading-tight text-emerald-900'>
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* register CTA */}
                  <button
                    onClick={goRegister}
                    className='mx-3 mt-2 rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white shadow transition active:bg-emerald-800'
                  >
                    {text.register}
                  </button>

                  {/* bottom nav */}
                  <nav className='mt-2 flex items-stretch justify-around border-t border-emerald-100 bg-white px-1 py-1.5'>
                    {phoneNav.map((n) => {
                      const Icon = n.icon
                      return (
                        <button
                          key={n.en}
                          onClick={() => router.push(n.href)}
                          className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-0.5 text-[8px] font-semibold ${n.active ? 'text-emerald-700' : 'text-gray-400'}`}
                        >
                          <Icon className='h-3.5 w-3.5' />
                          {lang === 'hi' ? n.hi : n.en}
                        </button>
                      )
                    })}
                  </nav>
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
