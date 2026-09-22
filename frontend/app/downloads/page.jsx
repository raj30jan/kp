'use client'

import { useEffect, useState } from 'react'
import { Download, FileImage, CreditCard, FileText, Sticker, Store, Loader2 } from 'lucide-react'

// Print-ready marketing material served from /public/downloads.
// Drop the files into frontend/public/downloads/ — see README.md there.
const ITEMS = [
  {
    key: 'hoarding',
    icon: FileImage,
    file: '/downloads/kisan-patrika-hoarding.pdf',
    title: 'Hoarding',
    titleHi: 'होर्डिंग',
    desc: 'Large-format roadside hoarding artwork for outdoor promotion.',
    descHi: 'बाहरी प्रचार के लिए बड़े आकार का होर्डिंग डिज़ाइन।',
  },
  {
    key: 'card',
    icon: CreditCard,
    file: '/downloads/kisan-patrika-visiting-card.pdf',
    title: 'Visiting Card',
    titleHi: 'विज़िटिंग कार्ड',
    desc: 'Print-ready visiting card design for field staff and partners.',
    descHi: 'फ़ील्ड स्टाफ और पार्टनर्स के लिए प्रिंट-रेडी विज़िटिंग कार्ड।',
  },
  {
    key: 'pamphlet',
    icon: FileText,
    file: '/downloads/kisan-patrika-pamphlet.pdf',
    title: 'Pamphlets',
    titleHi: 'पैम्फलेट',
    desc: 'Distribution pamphlets explaining KisanPatrika services to farmers.',
    descHi: 'किसानों को किसानपत्रिका सेवाएँ समझाने के लिए पैम्फलेट।',
  },
  {
    key: 'stickers',
    icon: Sticker,
    file: '/downloads/kisan-patrika-stickers.pdf',
    title: 'Stickers',
    titleHi: 'स्टिकर',
    desc: 'Sticker sheet for shops, vehicles and packaging.',
    descHi: 'दुकानों, वाहनों और पैकेजिंग के लिए स्टिकर शीट।',
  },
  {
    key: 'banner',
    icon: Store,
    file: '/downloads/kisan-patrika-store-banner.pdf',
    title: 'Store Banner',
    titleHi: 'स्टोर बैनर',
    desc: 'Banner artwork for partner shops and collection centres.',
    descHi: 'पार्टनर दुकानों और संग्रह केंद्रों के लिए बैनर डिज़ाइन।',
  },
]

export default function DownloadsPage() {
  const [lang, setLang] = useState('en')
  const isHindi = lang === 'hi'
  // availability[key] = true | false | undefined (checking)
  const [availability, setAvailability] = useState({})

  useEffect(() => {
    // HEAD-check each file so missing artwork shows "Coming soon" instead of a 404.
    ITEMS.forEach((item) => {
      fetch(item.file, { method: 'HEAD' })
        .then((r) => setAvailability((a) => ({ ...a, [item.key]: r.ok })))
        .catch(() => setAvailability((a) => ({ ...a, [item.key]: false })))
    })
  }, [])

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 py-16 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <Download className='mx-auto mb-4 h-12 w-12 text-emerald-300' />
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl'>
            {isHindi ? 'किसान पत्रिका — डाउनलोड' : 'Kisan Patrika — Downloads'}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-emerald-100'>
            {isHindi
              ? 'प्रिंट-रेडी मार्केटिंग सामग्री — होर्डिंग, कार्ड, पैम्फलेट, स्टिकर और स्टोर बैनर'
              : 'Print-ready marketing material — hoarding, visiting card, pamphlets, stickers and store banner'}
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-12 md:px-6'>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {ITEMS.map((item) => {
            const Icon = item.icon
            const ready = availability[item.key]
            return (
              <div key={item.key} className='flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md'>
                <span className='mb-4 inline-flex w-fit rounded-xl bg-emerald-50 p-3 text-emerald-700'>
                  <Icon className='h-7 w-7' />
                </span>
                <h3 className='text-lg font-bold text-gray-900'>{isHindi ? item.titleHi : item.title}</h3>
                <p className='mt-2 flex-1 text-sm text-gray-600'>{isHindi ? item.descHi : item.desc}</p>
                {ready === undefined ? (
                  <span className='mt-4 flex items-center justify-center gap-2 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-400'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    {isHindi ? 'जाँच हो रही है…' : 'Checking…'}
                  </span>
                ) : ready ? (
                  <a
                    href={item.file}
                    download
                    className='mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700'
                  >
                    <Download className='h-4 w-4' />
                    {isHindi ? 'डाउनलोड करें' : 'Download'}
                  </a>
                ) : (
                  <span className='mt-4 flex items-center justify-center rounded-lg bg-amber-50 py-2.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200'>
                    {isHindi ? 'जल्द आ रहा है' : 'Coming soon'}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <p className='mt-10 rounded-xl bg-white p-4 text-center text-xs text-gray-500 ring-1 ring-gray-100'>
          {isHindi
            ? 'ये डिज़ाइन केवल किसानपत्रिका के प्रचार के लिए हैं। किसी भी बदलाव से पहले एडमिन से संपर्क करें।'
            : 'These designs are for KisanPatrika promotion only. Contact the admin before making any modifications.'}
        </p>
      </section>

    </div>
  )
}
