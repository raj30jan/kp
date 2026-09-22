'use client'

import { useEffect, useState } from 'react'
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, Loader2, RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'

export default function ContactPage() {
  const [lang, setLang] = useState('en')
  const isHindi = lang === 'hi'
  const [form, setForm] = useState({ name: '', mobile: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Same math captcha used at registration — GET /auth/captcha.
  const [captcha, setCaptcha] = useState({ captchaId: '', question: '' })
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  const refreshCaptcha = () => {
    setCaptchaLoading(true)
    setCaptchaAnswer('')
    api.getCaptcha()
      .then((data) => setCaptcha({ captchaId: data?.captchaId || '', question: data?.question || '' }))
      .catch(() => setCaptcha({ captchaId: '', question: '' }))
      .finally(() => setCaptchaLoading(false))
  }

  useEffect(() => { refreshCaptcha() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!captcha.captchaId || !captchaAnswer.trim()) {
      setError(isHindi ? 'कृपया कैप्चा का उत्तर दर्ज करें' : 'Please answer the captcha')
      return
    }
    setSubmitting(true)
    try {
      await api.submitContact({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || undefined,
        message: form.message.trim(),
        captchaId: captcha.captchaId,
        captchaAnswer: captchaAnswer.trim(),
      })
      setSent(true)
      setForm({ name: '', mobile: '', email: '', message: '' })
      setTimeout(() => setSent(false), 6000)
    } catch (err) {
      setError(err?.message || (isHindi ? 'संदेश नहीं भेजा जा सका — पुनः प्रयास करें' : 'Could not send message — please try again'))
    } finally {
      setSubmitting(false)
      refreshCaptcha() // captcha is single-use — always fetch a fresh one
    }
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
                {isHindi
                  ? 'संदेश भेजा गया! पुष्टि ईमेल आपके ईमेल पर भेजी गई है। हम जल्द आपसे संपर्क करेंगे।'
                  : 'Message sent! A confirmation email is on its way to your inbox. We will get back to you soon.'}
              </div>
            )}
            {error && (
              <div className='mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700'>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>{isHindi ? 'नाम' : 'Name'} *</label>
                <input type='text' required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder={isHindi ? 'अपना नाम' : 'Your name'} />
              </div>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{isHindi ? 'मोबाइल' : 'Mobile'} *</label>
                  <input type='tel' required maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputClass} placeholder='10-digit mobile' />
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{isHindi ? 'ईमेल' : 'Email'}</label>
                  <input type='email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder='email@example.com' />
                </div>
              </div>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>{isHindi ? 'संदेश' : 'Message'} *</label>
                <textarea required rows={4} minLength={10} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputClass} placeholder={isHindi ? 'अपना संदेश लिखें (कम से कम 10 अक्षर)' : 'Write your message (min 10 characters)'} />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-gray-700'>{isHindi ? 'कैप्चा' : 'Captcha'} *</label>
                <div className='flex items-center gap-3'>
                  <div className='flex h-11 min-w-[110px] items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-bold tracking-wide text-gray-800'>
                    {captchaLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : (captcha.question || '—')}
                  </div>
                  <input
                    type='text'
                    inputMode='numeric'
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    placeholder={isHindi ? 'उत्तर दर्ज करें' : 'Enter the answer'}
                  />
                  <button
                    type='button'
                    onClick={refreshCaptcha}
                    disabled={captchaLoading}
                    className='shrink-0 rounded-lg border border-gray-200 p-2.5 text-gray-500 transition hover:bg-gray-50 disabled:opacity-50'
                    aria-label={isHindi ? 'नया कैप्चा' : 'Refresh captcha'}
                  >
                    <RefreshCw className={`h-4 w-4 ${captchaLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <button
                type='submit'
                disabled={submitting}
                className='flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60'
              >
                {submitting ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
                {submitting ? (isHindi ? 'भेजा जा रहा है…' : 'Sending…') : (isHindi ? 'भेजें' : 'Send Message')}
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  )
}
