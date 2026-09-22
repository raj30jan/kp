'use client'

import { useState } from 'react'
import { FileText, AlertTriangle, Shield, BookOpen, Gavel, Send } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

const CATEGORIES = [
  { value: 'legal', label: 'Legal', labelHi: 'कानूनी', icon: Gavel, desc: 'Legal notices or proceedings' },
  { value: 'terms', label: 'Terms & Conditions', labelHi: 'नियम एवं शर्तें', icon: BookOpen, desc: 'Violation of platform terms' },
  { value: 'policy', label: 'Policy of Use', labelHi: 'उपयोग नीति', icon: Shield, desc: 'Misuse of platform policies' },
  { value: 'fraud', label: 'Fraud Identification', labelHi: 'धोखाधड़ी पहचान', icon: AlertTriangle, desc: 'Report fraudulent activity' },
  { value: 'other', label: 'Other', labelHi: 'अन्य', icon: FileText, desc: 'Any other complaint' },
]

const t = {
  en: {
    title: 'File a Complaint',
    sub: 'Report issues related to Legal, Terms & Conditions, Policy of Use, or Fraud Identification.',
    subject: 'Subject *',
    subjectPh: 'Brief title of your complaint',
    description: 'Description *',
    descriptionPh: 'Describe the issue in detail...',
    mobile: 'Mobile (optional)',
    email: 'Email (optional)',
    submitting: 'Submitting...',
    submit: 'Submit Complaint',
    success: 'Complaint filed successfully',
    fail: 'Failed to file complaint',
    legalTitle: 'Legal & Policy Information',
    termsH: 'Terms & Conditions',
    termsP: 'By using KisanPatrika, you agree to our platform terms. Sellers must provide accurate product information. Buyers are responsible for verifying product quality before purchase.',
    policyH: 'Policy of Use',
    policyP: 'This platform is for agricultural trade only. Misuse including spam listings, fake profiles, or unauthorized commercial activity will result in account suspension.',
    fraudH: 'Fraud Identification',
    fraudP: 'If you suspect fraudulent activity (fake listings, payment scams, misrepresentation), file a complaint under the Fraud category. Our team investigates all reports within 48 hours.',
  },
  hi: {
    title: 'शिकायत दर्ज करें',
    sub: 'कानूनी, नियम एवं शर्तें, उपयोग नीति या धोखाधड़ी पहचान से जुड़ी समस्याओं की रिपोर्ट करें।',
    subject: 'विषय *',
    subjectPh: 'अपनी शिकायत का संक्षिप्त शीर्षक',
    description: 'विवरण *',
    descriptionPh: 'समस्या का विस्तार से वर्णन करें...',
    mobile: 'मोबाइल (वैकल्पिक)',
    email: 'ईमेल (वैकल्पिक)',
    submitting: 'जमा हो रहा है...',
    submit: 'शिकायत जमा करें',
    success: 'शिकायत सफलतापूर्वक दर्ज हुई',
    fail: 'शिकायत दर्ज करने में विफल',
    legalTitle: 'कानूनी और नीति जानकारी',
    termsH: 'नियम एवं शर्तें',
    termsP: 'KisanPatrika का उपयोग करके, आप हमारी प्लेटफ़ॉर्म शर्तों से सहमत होते हैं। विक्रेताओं को सटीक उत्पाद जानकारी देनी होगी। खरीदार खरीद से पहले उत्पाद की गुणवत्ता सत्यापित करने के लिए ज़िम्मेदार हैं।',
    policyH: 'उपयोग नीति',
    policyP: 'यह प्लेटफ़ॉर्म केवल कृषि व्यापार के लिए है। स्पैम लिस्टिंग, नकली प्रोफ़ाइल या अनधिकृत व्यावसायिक गतिविधि सहित दुरुपयोग करने पर खाता निलंबित हो जाएगा।',
    fraudH: 'धोखाधड़ी पहचान',
    fraudP: 'यदि आपको धोखाधड़ी (नकली लिस्टिंग, भुगतान घोटाले, गलत जानकारी) का संदेह है, तो धोखाधड़ी श्रेणी में शिकायत दर्ज करें। हमारी टीम 48 घंटों के भीतर सभी रिपोर्टों की जाँच करती है।',
  },
}

export default function ComplaintsPage() {
  const { lang } = useLang()
  const text = t[lang] || t.en
  const isHindi = lang === 'hi'
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [contactMobile, setContactMobile] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
      const res = await api.createComplaint(
        { category, subject, description, contactMobile: contactMobile || undefined, contactEmail: contactEmail || undefined },
        token,
      )
      setMessage(res.message || text.success)
      setSubject('')
      setDescription('')
      setContactMobile('')
      setContactEmail('')
      setCategory('')
    } catch (err) {
      setError(err.message || text.fail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-3xl px-4 py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>{text.title}</h1>
          <p className='mt-1 text-sm text-gray-500'>
            {text.sub}
          </p>
        </div>

        {/* Category cards */}
        <div className='mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {CATEGORIES.map((c) => {
            const Icon = c.icon
            return (
              <button
                key={c.value}
                type='button'
                onClick={() => setCategory(c.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition ${
                  category === c.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}
              >
                <Icon className={`h-7 w-7 ${category === c.value ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className='text-xs font-semibold text-gray-700'>{isHindi ? c.labelHi : c.label}</span>
                <span className='text-[10px] text-gray-400'>{isHindi ? c.label : c.labelHi}</span>
              </button>
            )
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-4 rounded-2xl bg-white p-6 shadow-sm'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>{text.subject}</label>
            <input
              type='text'
              required
              minLength={3}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              placeholder={text.subjectPh}
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>{text.description}</label>
            <textarea
              required
              minLength={10}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              placeholder={text.descriptionPh}
            />
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>{text.mobile}</label>
              <input
                type='tel'
                value={contactMobile}
                onChange={(e) => setContactMobile(e.target.value)}
                className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                placeholder='9876543210'
              />
            </div>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>{text.email}</label>
              <input
                type='email'
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                placeholder='you@example.com'
              />
            </div>
          </div>

          {message && (
            <div className='rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700'>{message}</div>
          )}
          {error && (
            <div className='rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</div>
          )}

          <button
            type='submit'
            disabled={submitting || !category}
            className='flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <Send className='h-4 w-4' />
            {submitting ? text.submitting : text.submit}
          </button>
        </form>

        {/* Legal info section */}
        <div className='mt-8 space-y-4'>
          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <h2 className='mb-3 text-lg font-bold text-gray-900'>{text.legalTitle}</h2>
            <div className='space-y-3 text-sm text-gray-600'>
              <div>
                <h3 className='font-semibold text-gray-800'>{text.termsH}</h3>
                <p>{text.termsP}</p>
              </div>
              <div>
                <h3 className='font-semibold text-gray-800'>{text.policyH}</h3>
                <p>{text.policyP}</p>
              </div>
              <div>
                <h3 className='font-semibold text-gray-800'>{text.fraudH}</h3>
                <p>{text.fraudP}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
