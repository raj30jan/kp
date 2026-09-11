'use client'

import { useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send, MessageSquare } from 'lucide-react'

export default function ContactPage() {
  const [lang, setLang] = useState('en')
  const isHindi = lang === 'hi'
  const [form, setForm] = useState({ name: '', mobile: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 3000)
    setForm({ name: '', mobile: '', email: '', message: '' })
  }

  const contacts = [
    { icon: Phone, label: isHindi ? 'फोन' : 'Phone', value: '+91-1800-123-4567', sub: isHindi ? 'सुबह 9 बजे से रात 9 बजे' : '9 AM to 9 PM' },
    { icon: Mail, label: isHindi ? 'ईमेल' : 'Email', value: 'support@kisanpatrika.com', sub: isHindi ? '24 घंटे में उत्तर' : 'Reply within 24 hours' },
    { icon: MapPin, label: isHindi ? 'पता' : 'Address', value: isHindi ? 'मोहाली, पंजाब, भारत' : 'Mohali, Punjab, India', sub: isHindi ? 'मुख्य कार्यालय' : 'Head Office' },
    { icon: Clock, label: isHindi ? 'समय' : 'Hours', value: isHindi ? 'सोम-रवि: 9AM - 9PM' : 'Mon-Sun: 9AM - 9PM', sub: isHindi ? 'सप्ताह के 7 दिन' : '7 days a week' },
  ]

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 py-16 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl'>
            {isHindi ? 'संपर्क करें' : 'Contact Us'}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-emerald-100'>
            {isHindi ? 'किसी भी सवाल या सहायता के लिए हमसे संपर्क करें' : 'Reach out to us for any questions or assistance'}
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-16 md:px-6'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          <div>
            <h2 className='mb-6 text-2xl font-bold text-gray-900'>
              {isHindi ? 'संपर्क जानकारी' : 'Contact Information'}
            </h2>
            <div className='space-y-4'>
              {contacts.map((c) => {
                const Icon = c.icon
                return (
                  <div key={c.label} className='flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100'>
                    <span className='rounded-xl bg-emerald-50 p-3 text-emerald-700'>
                      <Icon className='h-6 w-6' />
                    </span>
                    <div>
                      <p className='text-sm font-semibold text-gray-500'>{c.label}</p>
                      <p className='text-base font-bold text-gray-900'>{c.value}</p>
                      <p className='text-sm text-gray-500'>{c.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className='rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100'>
            <div className='mb-6 flex items-center gap-2'>
              <MessageSquare className='h-6 w-6 text-emerald-600' />
              <h2 className='text-2xl font-bold text-gray-900'>
                {isHindi ? 'संदेश भेजें' : 'Send a Message'}
              </h2>
            </div>
            {sent && (
              <div className='mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700'>
                {isHindi ? 'संदेश भेजा गया! हम जल्द आपसे संपर्क करेंगे।' : 'Message sent! We will get back to you soon.'}
              </div>
            )}
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>{isHindi ? 'नाम' : 'Name'}</label>
                <input type='text' required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder={isHindi ? 'अपना नाम' : 'Your name'} />
              </div>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{isHindi ? 'मोबाइल' : 'Mobile'}</label>
                  <input type='tel' required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputClass} placeholder='10-digit mobile' />
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{isHindi ? 'ईमेल' : 'Email'}</label>
                  <input type='email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder='email@example.com' />
                </div>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>{isHindi ? 'संदेश' : 'Message'}</label>
                <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputClass} placeholder={isHindi ? 'अपना संदेश लिखें' : 'Write your message'} />
              </div>
              <button type='submit' className='flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700'>
                <Send className='h-4 w-4' />
                {isHindi ? 'भेजें' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  )
}
