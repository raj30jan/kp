'use client'

import { useState } from 'react'
import { Sprout, Target, Eye, Heart, Users, Globe, Award, TrendingUp } from 'lucide-react'

export default function AboutPage() {
  const [lang, setLang] = useState('hi')
  const isHindi = lang === 'hi'

  const values = [
    { icon: Heart, en: { title: 'Farmer First', desc: 'Every decision we make puts farmers at the center.' }, hi: { title: 'किसान पहले', desc: 'हमारा हर निर्णय किसानों को केंद्र में रखता है।' } },
    { icon: Globe, en: { title: 'Global Reach', desc: 'Connecting Indian farmers to domestic and international markets.' }, hi: { title: 'वैश्विक पहुंच', desc: 'भारतीय किसानों को घरेलू और अंतर्राष्ट्रीय बाजारों से जोड़ना।' } },
    { icon: Award, en: { title: 'Quality & Trust', desc: 'Verified listings, secure transactions, and transparent pricing.' }, hi: { title: 'गुणवत्ता और भरोसा', desc: 'सत्यापित सूची, सुरक्षित लेन-देन, और पारदर्शी मूल्य निर्धारण।' } },
    { icon: TrendingUp, en: { title: 'Growth Oriented', desc: 'Tools and insights that help farmers grow their income.' }, hi: { title: 'विकास उन्मुख', desc: 'ऐसे उपकरण और जानकारी जो किसानों की आय बढ़ाने में मदद करते हैं।' } },
  ]

  const stats = [
    { value: '10M+', label: isHindi ? 'किसान' : 'Farmers' },
    { value: '500K+', label: isHindi ? 'खरीदार' : 'Buyers' },
    { value: '2M+', label: isHindi ? 'उत्पाद' : 'Products' },
    { value: '500+', label: isHindi ? 'जिले' : 'Districts' },
  ]

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 py-20 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <div className='mb-6 inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 backdrop-blur'>
            <Sprout className='mr-2 h-5 w-5 text-emerald-300' />
            <span className='text-sm font-medium text-emerald-50'>
              {isHindi ? 'किसानपत्रिका के बारे में' : 'About KisanPatrika'}
            </span>
          </div>
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl'>
            {isHindi ? 'हर किसान की अपनी पत्रिका' : 'Har Kisan Ki Apni Patrika'}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-emerald-100'>
            {isHindi
              ? 'किसानपत्रिका एक किसान-से-उपभोक्ता (F2C) डिजिटल मार्केटप्लेस और फार्म इकोसिस्टम है जो छोटे से बड़े किसानों को सीधे उपभोक्ताओं और फुटकर विक्रेताओं से जोड़ता है।'
              : 'KisanPatrika is a farmer-to-consumer (F2C) digital marketplace and farm ecosystem that connects small to large farmers directly with consumers and retailers.'}
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-16 md:px-6'>
        <div className='grid grid-cols-2 gap-6 md:grid-cols-4'>
          {stats.map((s) => (
            <div key={s.label} className='rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100'>
              <p className='text-3xl font-extrabold text-emerald-700'>{s.value}</p>
              <p className='mt-1 text-sm text-gray-500'>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-8 md:px-6'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
          <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100'>
            <Target className='h-10 w-10 text-emerald-600' />
            <h2 className='mt-4 text-2xl font-bold text-gray-900'>
              {isHindi ? 'हमारा मिशन' : 'Our Mission'}
            </h2>
            <p className='mt-3 text-sm leading-relaxed text-gray-600'>
              {isHindi
                ? 'हर भारतीय किसान तक डिजिटल उपकरण, बाजार पहुंच और विशेषज्ञ जानकारी पहुंचाना — ताकि कोई भी किसान मध्यस्थों पर निर्भर न रहे और अपनी उपज का सही मूल्य प्राप्त कर सके।'
                : 'To empower every Indian farmer with digital tools, market access, and expert knowledge — so no farmer depends on middlemen and gets fair value for their produce.'}
            </p>
          </div>
          <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100'>
            <Eye className='h-10 w-10 text-emerald-600' />
            <h2 className='mt-4 text-2xl font-bold text-gray-900'>
              {isHindi ? 'हमारा विज़न' : 'Our Vision'}
            </h2>
            <p className='mt-3 text-sm leading-relaxed text-gray-600'>
              {isHindi
                ? 'एक ऐसा भारत जहाँ किसानी एक लाभदायक और सम्मानित व्यवसाय हो — तकनीक, पारदर्शिता और सीधे बाजार पहुंच के माध्यम से।'
                : 'An India where farming is a profitable and respected profession — enabled by technology, transparency, and direct market access.'}
            </p>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-16 md:px-6'>
        <h2 className='mb-8 text-center text-3xl font-bold text-gray-900'>
          {isHindi ? 'हमारे मूल्य' : 'Our Core Values'}
        </h2>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {values.map((v) => {
            const Icon = v.icon
            const data = isHindi ? v.hi : v.en
            return (
              <div key={data.title} className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md'>
                <span className='inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700'>
                  <Icon className='h-6 w-6' />
                </span>
                <h3 className='mt-4 text-lg font-bold text-gray-900'>{data.title}</h3>
                <p className='mt-2 text-sm text-gray-600'>{data.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
