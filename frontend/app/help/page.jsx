'use client'

import { useState } from 'react'
import { HelpCircle, ChevronDown, Phone, Mail, MessageSquare, Search } from 'lucide-react'

export default function HelpPage() {
  const [lang, setLang] = useState('hi')
  const isHindi = lang === 'hi'
  const [open, setOpen] = useState(null)
  const [search, setSearch] = useState('')

  const faqs = [
    {
      q: isHindi ? 'किसानपत्रिका पर पंजीकरण कैसे करें?' : 'How do I register on KisanPatrika?',
      a: isHindi
        ? 'होम पेज पर "लॉग इन / पंजीकरण" बटन पर क्लिक करें, "पंजीकरण" टैब चुनें, अपनी जानकारी भरें और OTP सत्यापित करें।'
        : 'Click the "Login / Register" button on the home page, select the "Register" tab, fill in your details, and verify via OTP.',
    },
    {
      q: isHindi ? 'क्या किसानपत्रिका की सेवाएँ मुफ्त हैं?' : 'Are KisanPatrika services free?',
      a: isHindi
        ? 'हाँ, मंडी भाव, मौसम पूर्वानुमान, सरकारी योजना जानकारी और उत्पाद सूचीकरण जैसी बुनियादी सेवाएँ मुफ्त हैं।'
        : 'Yes, basic services like mandi rates, weather forecasts, government scheme info, and product listing are free.',
    },
    {
      q: isHindi ? 'अपना उत्पाद कैसे बेचें?' : 'How do I sell my products?',
      a: isHindi
        ? 'मार्केटप्लेस पर जाएं, "अपना उत्पाद बेचें" बटन पर क्लिक करें, उत्पान की जानकारी और फोटो अपलोड करें।'
        : 'Go to the Marketplace, click "Sell your product", fill in product details and upload photos.',
    },
    {
      q: isHindi ? 'मंडी भाव कैसे देखें?' : 'How to check mandi rates?',
      a: isHindi
        ? 'होम पेज पर "मंडी भाव" सेवा पर क्लिक करें या सीधे मंडी पेज पर जाएं। आप राज्य और फसल के अनुसार भाव देख सकते हैं।'
        : 'Click on "Mandi Bhav" service on the home page or go to the Mandi page directly. You can filter by state and crop.',
    },
    {
      q: isHindi ? 'OTP नहीं आया तो क्या करें?' : 'What if I dont receive OTP?',
      a: isHindi
        ? '60 सेकंड प्रतीक्षा करें और "OTP पुनः भेजें" बटन पर क्लिक करें। यदि अभी भी नहीं आता है, तो हेल्पलाइन नंबर पर कॉल करें।'
        : 'Wait 60 seconds and click "Resend OTP". If still not received, call our helpline number.',
    },
    {
      q: isHindi ? 'अपना पासवर्ड कैसे बदलें?' : 'How to change my password?',
      a: isHindi
        ? 'लॉग इन करने के बाद, प्रोफाइल पेज पर जाएं और "पासवर्ड बदलें" विकल्प चुनें।'
        : 'After logging in, go to the Profile page and select "Change Password".',
    },
    {
      q: isHindi ? 'क्या मैं अपना खाता हटा सकता हूँ?' : 'Can I delete my account?',
      a: isHindi
        ? 'हाँ, प्रोफाइल सेटिंग्स में "खाता हटाएं" विकल्प पर क्लिक करें या support@kisanpatrika.com पर अनुरोध भेजें।'
        : 'Yes, click "Delete Account" in profile settings or email support@kisanpatrika.com.',
    },
    {
      q: isHindi ? 'सदस्यता के क्या लाभ हैं?' : 'What are the membership benefits?',
      a: isHindi
        ? 'सदस्यता के साथ आपको प्राथमिकता सूचीकरण, उन्नत एनालिटिक्स, और विशेष खरीदार खोज सुविधाएँ मिलती हैं।'
        : 'Membership gives you priority listings, advanced analytics, and special buyer discovery features.',
    },
  ]

  const filtered = faqs.filter((f) => f.q.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 py-16 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <HelpCircle className='mx-auto mb-4 h-12 w-12 text-emerald-300' />
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl'>
            {isHindi ? 'सहायता और प्रश्न' : 'Help & FAQ'}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-emerald-100'>
            {isHindi ? 'अपने सवालों के जवाब यहाँ खोजें' : 'Find answers to your questions here'}
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-3xl px-4 py-16 md:px-6'>
        <div className='relative mb-8'>
          <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400' />
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isHindi ? 'अपना सवाल खोजें...' : 'Search your question...'}
            className='w-full rounded-full border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
          />
        </div>

        <div className='space-y-3'>
          {filtered.map((f, i) => (
            <div key={i} className='rounded-2xl bg-white shadow-sm ring-1 ring-gray-100'>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className='flex w-full items-center justify-between p-5 text-left'
              >
                <span className='text-sm font-semibold text-gray-900'>{f.q}</span>
                <ChevronDown className={`h-5 w-5 flex-shrink-0 text-gray-400 transition ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <div className='border-t border-gray-100 px-5 py-4'>
                  <p className='text-sm text-gray-600'>{f.a}</p>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className='rounded-2xl bg-white p-10 text-center text-gray-500'>
              {isHindi ? 'कोई परिणाम नहीं मिला' : 'No results found'}
            </div>
          )}
        </div>

        <div className='mt-12 rounded-2xl bg-emerald-50 p-6 text-center'>
          <h3 className='text-lg font-bold text-emerald-800'>
            {isHindi ? 'अभी भी मदद चाहिए?' : 'Still need help?'}
          </h3>
          <p className='mt-2 text-sm text-gray-600'>
            {isHindi ? 'हमारी टीम से संपर्क करें' : 'Get in touch with our team'}
          </p>
          <div className='mt-4 flex flex-wrap justify-center gap-4'>
            <a href='tel:18001234567' className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'>
              <Phone className='h-4 w-4' /> 1800-123-4567
            </a>
            <a href='mailto:support@kisanpatrika.com' className='inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50'>
              <Mail className='h-4 w-4' /> Email Us
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
