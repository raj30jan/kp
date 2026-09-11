'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import HeroBanner from './components/HeroBanner'
import {
  Bot,
  Globe,
  ShoppingCart,
  Store,
  ArrowLeftRight,
  Users,
  Package,
  Ship,
  Plane,
  Briefcase,
  Search,
  KeyRound,
  Landmark,
  MapPin,
  HeartHandshake,
  Leaf,
  HardHat,
  Trees,
  HandCoins,
  Sun,
  CloudRain,
  TrendingUp,
  Tractor,
} from 'lucide-react'
import { api } from '../lib/api'
import { getSessionId } from '../lib/session'

const t = {
  en: {
    login: 'Login / Register',
    heroTitle: 'Global Farmers Connect — The Marketplace Built for Farmers, Buyers & Retailers',
    heroSlogan: 'KisanPatrika — Har Kisan Ki Apni Patrika',
    heroSubtitle:
      'A farmers-to-consumer (F2C) digital marketplace and farm ecosystem that connects small to big farmers directly with consumers and retailers — combining real market access, traceable produce, and expert support.',
    services: 'Our Services',
    freeInfo: 'Valuable Information for Farmers',
    freeInfoIntro:
      'These free tools help farmers plan better, sell smarter, reduce risks, and stay updated with market prices, weather alerts, and government support.',
    readMore: 'Read more',
    footerSlogan: 'Har Kisan Ki Apni Patrika',
    about: 'About Us',
    legal: 'Legal',
    privacy: 'Privacy Policy',
    help: 'Help',
    contact: 'Contact',
    rights: 'All rights reserved.',
  },
  hi: {
    login: 'लॉग इन / पंजीकरण',
    heroTitle: 'ग्लोबल किसान कनेक्ट — किसानों, खरीदारों और फुटकर विक्रेताओं के लिए बना मार्केटप्लेस',
    heroSlogan: 'किसानपत्रिका — हर किसान की अपनी पत्रिका',
    heroSubtitle:
      'एक किसान-से-उपभोक्ता (F2C) डिजिटल मार्केटप्लेस और फार्म इकोसिस्टम जो छोटे से बड़े किसानों को सीधे उपभोक्ताओं और फुटकर विक्रेताओं से जोड़ता है — असली बाजार पहुंच, ट्रेसेबल उपज और विशेषज्ञ सहायता के साथ।',
    services: 'हमारी सेवाएँ',
    freeInfo: 'किसानों के लिए मूल्यवान जानकारी',
    freeInfoIntro:
      'ये मुफ्त टूल किसानों को बेहतर योजना बनाने, समझदारी से बेचने, जोखिम कम करने और बाज़ार भाव, मौसम अलर्ट और सरकारी सहायता से अपडेट रहने में मदद करते हैं।',
    readMore: 'और पढ़ें',
    footerSlogan: 'हर किसान की अपनी पत्रिका',
    about: 'हमारे बारे में',
    legal: 'कानूनी',
    privacy: 'गोपनीयता नीति',
    help: 'सहायता',
    contact: 'संपर्क करें',
    rights: 'सर्वाधिकार सुरक्षित।',
  },
}

const services = [
  { key: 'Buyers', en: 'Buyers', hi: 'क्रेता', icon: ShoppingCart },
  { key: 'Sellers', en: 'Sellers', hi: 'विक्रेता', icon: Store },
  { key: 'Lessees', en: 'Lessees', hi: 'पट्टाधारी', icon: KeyRound },
  { key: 'Barter', en: 'Barter', hi: 'वस्त्र विनिमय', icon: ArrowLeftRight },
  { key: 'Participants', en: 'Participants', hi: 'प्रतिभागी', icon: Users },
  { key: 'Importers', en: 'Importers', hi: 'आयातक', icon: Ship },
  { key: 'Exporters', en: 'Exporters', hi: 'निर्यातक', icon: Plane },
  { key: 'Service Providers', en: 'Service Providers', hi: 'सेवा प्रदाता', icon: Briefcase },
  { key: 'Service Seekers', en: 'Service Seekers', hi: 'सेवा खोजने वाले', icon: Search },
  { key: 'Lessors', en: 'Lessors', hi: 'पट्टादाता', icon: Landmark },
  { key: 'Loan & Subsidy', en: 'Loan, Subsidy & Govt Schemes', hi: 'ऋण, सब्सिडी और सरकारी योजनाएँ', icon: HandCoins },
  { key: 'Our Stores', en: 'Our Stores', hi: 'हमारे स्टोर', icon: MapPin },
  { key: 'Membership', en: 'Our Membership', hi: 'हमारी सदस्यता', icon: HeartHandshake },
  { key: 'Fertilisers & Pesticides', en: 'Fertilisers & Pesticides', hi: 'उर्वरक और कीटनाशक', icon: Leaf },
  { key: 'Hire Labour', en: 'Hire Labour', hi: 'श्रमिक किराए पर लें', icon: HardHat },
  { key: 'Hire Machinery', en: 'Hire Machinery — JCB, Tractor, Combine, Drone', hi: 'मशीन किराए पर — जेसीबी, ट्रैक्टर, कंबाइन, ड्रोन', icon: Tractor },
  { key: 'Land Sale / Purchase', en: 'Land Sale / Purchase', hi: 'भूमि खरीद / बिक्री', icon: Trees },
  { key: 'Lease', en: 'Lease — Land / Equipment', hi: 'पट्टा — भूमि / उपकरण', icon: KeyRound },
]

const bannerItems = [
  { icon: TrendingUp, en: 'Mandi Rates', hi: 'मंडी भाव' },
  { icon: ShoppingCart, en: 'Buy & Sell', hi: 'खरीद-बिक्री' },
  { icon: CloudRain, en: 'Weather', hi: 'मौसम' },
  { icon: HandCoins, en: 'Finance', hi: 'वित्त' },
]

const freeInfo = [
  {
    key: 'mandi',
    icon: TrendingUp,
    en: { title: 'Mandi Bhav', desc: 'Daily mandi rates for major crops across India.' },
    hi: { title: 'मंडी भाव', desc: 'भारत भर के प्रमुख फसलों के दैनिक मंडी भाव।' },
  },
  {
    key: 'subsidy',
    icon: HandCoins,
    en: { title: 'Govt Subsidy & Loans', desc: 'Latest PM-KISAN, KCC, and state subsidy schemes.' },
    hi: { title: 'सरकारी सब्सिडी और ऋण', desc: 'नवीनतम पीएम-किसान, केसीसी और राज्य सब्सिडी योजनाएँ।' },
  },
  {
    key: 'weather',
    icon: CloudRain,
    en: { title: 'Weather Forecast', desc: '7-day weather, rainfall alerts and farming advice.' },
    hi: { title: 'मौसम पूर्वानुमान', desc: '7-दिवसीय मौसम, वर्षा अलर्ट और कृषि सलाह।' },
  },
  {
    key: 'store',
    icon: MapPin,
    en: { title: 'Our Store Locations', desc: 'Find the nearest KisanPatrika support center.' },
    hi: { title: 'हमारे स्टोर स्थान', desc: 'निकटतम किसानपत्रिका सहायता केंद्र खोजें।' },
  },
  {
    key: 'jaankari',
    icon: Globe,
    en: { title: 'Kisan Jaankari', desc: 'Crop guidance, disease control and organic farming tips.' },
    hi: { title: 'किसान जानकारी', desc: 'फसल मार्गदर्शन, रोग नियंत्रण और जैविक खेती के सुझाव।' },
  },
]

const footerLinks = [
  { label: 'about', href: '#' },
  { label: 'legal', href: '#' },
  { label: 'privacy', href: '#' },
  { label: 'help', href: '#' },
  { label: 'contact', href: '#' },
]

function LanguageSelect({ lang, setLang }) {
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className='rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-emerald-500'
    >
      <option value='en'>English</option>
      <option value='hi'>हिन्दी</option>
    </select>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [lang, setLang] = useState('en')
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

  return (
    <div className='min-h-screen bg-slate-50'>
      <HeroBanner lang={lang} goToLogin={goToLogin} />

      {/* Buy / Sell Banner */}
      <section className='bg-white py-8 md:py-12'>
        <div className='mx-auto max-w-7xl px-4 md:px-6'>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6'>
            {/* Buy Button */}
            <button
              onClick={() => router.push('/marketplace')}
              className='group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl md:p-12'
            >
              <div className='absolute right-4 top-4 opacity-10 transition group-hover:opacity-20'>
                <ShoppingCart className='h-32 w-32' />
              </div>
              <div className='relative z-10 flex flex-col items-center'>
                <div className='rounded-full bg-white/20 p-4 backdrop-blur'>
                  <ShoppingCart className='h-12 w-12 md:h-16 md:w-16' />
                </div>
                <h2 className='mt-4 text-2xl font-extrabold md:text-4xl'>
                  {lang === 'hi' ? 'खरीदें' : 'BUY'}
                </h2>
                <p className='mt-2 text-center text-sm text-amber-100 md:text-lg'>
                  {lang === 'hi'
                    ? 'बीज, उपकरण, उर्वरक, मवेशी और खेती का सामान खरीदें'
                    : 'Seeds, Tools, Fertilizers, Livestock & Farm Supplies'}
                </p>
                <span className='mt-4 rounded-full bg-white px-6 py-2.5 text-base font-bold text-orange-600 transition group-hover:bg-amber-50 md:text-lg'>
                  {lang === 'hi' ? 'अभी खरीदें →' : 'Browse Now →'}
                </span>
              </div>
            </button>

            {/* Sell Button */}
            <button
              onClick={() => {
                try { api.recordServiceInterest({ sessionId: getSessionId(), serviceCode: 'SELL', serviceName: 'Sell Product', sourcePage: 'home', token: localStorage.getItem('kp_token') || undefined, mobile: localStorage.getItem('kp_mobile') || undefined }).catch(()=>{}) } catch {}
                router.push('/sell')
              }}
              className='group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-green-700 p-8 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl md:p-12'
            >
              <div className='absolute right-4 top-4 opacity-10 transition group-hover:opacity-20'>
                <Store className='h-32 w-32' />
              </div>
              <div className='relative z-10 flex flex-col items-center'>
                <div className='rounded-full bg-white/20 p-4 backdrop-blur'>
                  <Store className='h-12 w-12 md:h-16 md:w-16' />
                </div>
                <h2 className='mt-4 text-2xl font-extrabold md:text-4xl'>
                  {lang === 'hi' ? 'बेचें' : 'SELL'}
                </h2>
                <p className='mt-2 text-center text-sm text-emerald-100 md:text-lg'>
                  {lang === 'hi'
                    ? 'अपनी फसल, सब्ज़ी, फल और खेती उत्पाद बेचें'
                    : 'Sell Your Crops, Vegetables, Fruits & Farm Products'}
                </p>
                <span className='mt-4 rounded-full bg-white px-6 py-2.5 text-base font-bold text-emerald-700 transition group-hover:bg-emerald-50 md:text-lg'>
                  {lang === 'hi' ? 'अभी बेचें →' : 'Start Selling →'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className='mx-auto max-w-7xl px-4 py-16 md:px-6'>
        <h2 className='mb-10 text-center text-3xl font-bold text-gray-900'>{text.services}</h2>
        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {services.map((s) => {
            const Icon = s.icon
            const label = lang === 'hi' && s.hi ? s.hi : s.en
            return (
              <button
                key={s.key}
                onClick={() => goToLogin(s.en, s.key)}
                className='group flex flex-col items-start rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg hover:ring-emerald-200'
              >
                <span className='rounded-xl bg-emerald-50 p-3 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white'>
                  <Icon className='h-6 w-6' />
                </span>
                <h3 className='mt-4 text-base font-bold text-gray-900'>{label}</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  {lang === 'hi' ? 'और जानकारी के लिए क्लिक करें' : 'Click to explore'}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Free information */}
      <section className='bg-white py-16'>
        <div className='mx-auto max-w-7xl px-4 md:px-6'>
          <h2 className='mb-4 text-center text-3xl font-bold text-gray-900'>{text.freeInfo}</h2>
          <p className='mx-auto mb-10 max-w-3xl text-center text-gray-600'>{text.freeInfoIntro}</p>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {freeInfo.map((info) => {
              const Icon = info.icon
              const data = info[lang]
              return (
                <div
                  key={info.key}
                  className='rounded-2xl border border-gray-100 bg-slate-50 p-6 transition hover:shadow-md'
                >
                  <div className='mb-4 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-700'>
                    <Icon className='h-6 w-6' />
                  </div>
                  <h3 className='text-lg font-bold text-gray-900'>{data.title}</h3>
                  <p className='mt-2 text-sm text-gray-600'>{data.desc}</p>
                  <button
                    onClick={() => goToLogin(data.title)}
                    className='mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800'
                  >
                    {text.readMore} →
                  </button>
                </div>
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
