'use client'

import { useState } from 'react'
import { Landmark, HandCoins, FileText, CheckCircle, Calendar, ExternalLink } from 'lucide-react'

export default function SchemesPage() {
  const [lang, setLang] = useState('en')
  const isHindi = lang === 'hi'
  const [filter, setFilter] = useState('all')

  const categories = [
    { key: 'all', label: isHindi ? 'सभी' : 'All' },
    { key: 'central', label: isHindi ? 'केंद्रीय' : 'Central' },
    { key: 'state', label: isHindi ? 'राज्य' : 'State' },
    { key: 'loan', label: isHindi ? 'ऋण' : 'Loan' },
  ]

  const schemes = [
    {
      title: 'PM-KISAN',
      titleHi: 'पीएम-किसान',
      category: 'central',
      desc: isHindi
        ? 'छोटे और सीमांत किसानों को ₹6,000 प्रति वर्ष आय सहायता। तीन किस्तों में दिया जाता है।'
        : 'Income support of ₹6,000/year for small and marginal farmers. Paid in three installments.',
      eligibility: isHindi ? '2 हेक्टेयर तक भूमि वाले किसान' : 'Farmers with up to 2 hectares of land',
      deadline: isHindi ? 'चल रहा है' : 'Ongoing',
      benefits: '₹6,000/year',
    },
    {
      title: 'Kisan Credit Card (KCC)',
      titleHi: 'किसान क्रेडिट कार्ड',
      category: 'loan',
      desc: isHindi
        ? 'किसानों को कम ब्याज दर पर फसल ऋण। ₹3 लाख तक का ऋण उपलब्ध।'
        : 'Low-interest crop loans for farmers. Up to ₹3 lakh loan available.',
      eligibility: isHindi ? 'सभी पंजीकृत किसान' : 'All registered farmers',
      deadline: isHindi ? 'चल रहा है' : 'Ongoing',
      benefits: 'Up to ₹3 lakh @ 4%',
    },
    {
      title: 'Pradhan Mantri Fasal Bima Yojana',
      titleHi: 'प्रधानमंत्री फसल बीमा योजना',
      category: 'central',
      desc: isHindi
        ? 'फसल क्षति के खिलाफ बीमा। प्रीमियम केवल 1.5-2% प्रति फसल।'
        : 'Insurance against crop loss. Premium only 1.5-2% per crop.',
      eligibility: isHindi ? 'सभी ऋण लेने वाले किसान' : 'All loanee farmers',
      deadline: isHindi ? 'बोने के मौसम में' : 'Before sowing season',
      benefits: 'Full crop insurance',
    },
    {
      title: 'Sub-Mission on Agricultural Mechanization',
      titleHi: 'कृषि मशीनरी पर उप-मिशन',
      category: 'central',
      desc: isHindi
        ? 'कृषि मशीनरी खरीदने पर 25-50% सब्सिडी। ट्रैक्टर, हार्वेस्टर आदि शामिल।'
        : '25-50% subsidy on agricultural machinery purchase. Tractors, harvesters included.',
      eligibility: isHindi ? 'सभी किसान' : 'All farmers',
      deadline: isHindi ? 'मार्च 31' : 'March 31',
      benefits: 'Up to 50% subsidy',
    },
    {
      title: 'Punjab Free Power Scheme',
      titleHi: 'पंजाब मुफ्त बिजली योजना',
      category: 'state',
      desc: isHindi
        ? 'किसानों को सिंचाई के लिए मुफ्त बिजली। पंजाब सरकार द्वारा प्रदान।'
        : 'Free electricity for irrigation to farmers. Provided by Punjab Government.',
      eligibility: isHindi ? 'पंजाब के ट्यूबवेल कनेक्शन वाले किसान' : 'Punjab farmers with tube well connections',
      deadline: isHindi ? 'चल रहा है' : 'Ongoing',
      benefits: 'Free power up to 600 units',
    },
    {
      title: 'Soil Health Card Scheme',
      titleHi: 'मृदा स्वास्थ्य कार्ड योजना',
      category: 'central',
      desc: isHindi
        ? 'हर 2 साल में मुफ्त मिट्टी जांच। उर्वरक की सही मात्रा के लिए सलाह।'
        : 'Free soil testing every 2 years. Advice on correct fertilizer usage.',
      eligibility: isHindi ? 'सभी किसान' : 'All farmers',
      deadline: isHindi ? 'चल रहा है' : 'Ongoing',
      benefits: 'Free soil testing',
    },
    {
      title: 'Micro Irrigation Fund',
      titleHi: 'सूक्ष्म सिंचाई कोष',
      category: 'loan',
      desc: isHindi
        ? 'ड्रिप और स्प्रिंकलर सिंचाई के लिए 55% सब्सिडी। NABARD द्वारा वित्तपोषित।'
        : '55% subsidy for drip and sprinkler irrigation. Funded by NABARD.',
      eligibility: isHindi ? 'सभी किसान' : 'All farmers',
      deadline: isHindi ? 'चल रहा है' : 'Ongoing',
      benefits: '55% subsidy',
    },
    {
      title: 'National Agriculture Market (eNAM)',
      titleHi: 'राष्ट्रीय कृषि बाजार (eNAM)',
      category: 'central',
      desc: isHindi
        ? 'ऑनलाइन मंडी नीलामी। देश भर के 1000+ मंडियों में बेचें।'
        : 'Online mandi auction. Sell across 1000+ mandis nationwide.',
      eligibility: isHindi ? 'पंजीकृत किसान' : 'Registered farmers',
      deadline: isHindi ? 'चल रहा है' : 'Ongoing',
      benefits: 'Pan-India market access',
    },
  ]

  const filtered = filter === 'all' ? schemes : schemes.filter((s) => s.category === filter)

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-800 py-16 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <Landmark className='mx-auto mb-4 h-12 w-12 text-indigo-300' />
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl'>
            {isHindi ? 'सरकारी योजनाएँ और सब्सिडी' : 'Govt Schemes & Subsidies'}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-indigo-100'>
            {isHindi ? 'केंद्र और राज्य सरकार की किसान योजनाएँ' : 'Central and state government farmer schemes'}
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-12 md:px-6'>
        <div className='mb-8 flex flex-wrap gap-2'>
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === c.key ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {filtered.map((s) => (
            <div key={s.title} className='flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md'>
              <div className='mb-3 flex items-center justify-between'>
                <span className='rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700'>
                  {s.category === 'central' ? (isHindi ? 'केंद्रीय' : 'Central') :
                   s.category === 'state' ? (isHindi ? 'राज्य' : 'State') :
                   isHindi ? 'ऋण' : 'Loan'}
                </span>
                <HandCoins className='h-5 w-5 text-indigo-600' />
              </div>
              <h3 className='text-lg font-bold text-gray-900'>{isHindi ? s.titleHi : s.title}</h3>
              <p className='mt-2 text-sm text-gray-600'>{s.desc}</p>
              <div className='mt-4 space-y-2 text-sm'>
                <div className='flex items-start gap-2'>
                  <CheckCircle className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                  <span className='text-gray-600'><strong>{isHindi ? 'पात्रता' : 'Eligibility'}:</strong> {s.eligibility}</span>
                </div>
                <div className='flex items-start gap-2'>
                  <Calendar className='h-4 w-4 flex-shrink-0 text-amber-600' />
                  <span className='text-gray-600'><strong>{isHindi ? 'समय' : 'Deadline'}:</strong> {s.deadline}</span>
                </div>
                <div className='flex items-start gap-2'>
                  <FileText className='h-4 w-4 flex-shrink-0 text-indigo-600' />
                  <span className='text-gray-600'><strong>{isHindi ? 'लाभ' : 'Benefits'}:</strong> {s.benefits}</span>
                </div>
              </div>
              <button className='mt-4 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700'>
                {isHindi ? 'आवेदन करें' : 'Apply Now'}
                <ExternalLink className='h-3 w-3' />
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
