'use client'

import { useState } from 'react'
import { FileText, AlertTriangle, Shield, BookOpen, Gavel, Send } from 'lucide-react'
import { api } from '../../lib/api'

const CATEGORIES = [
  { value: 'legal', label: 'Legal', labelHi: 'कानूनी', icon: Gavel, desc: 'Legal notices or proceedings' },
  { value: 'terms', label: 'Terms & Conditions', labelHi: 'नियम एवं शर्तें', icon: BookOpen, desc: 'Violation of platform terms' },
  { value: 'policy', label: 'Policy of Use', labelHi: 'उपयोग नीति', icon: Shield, desc: 'Misuse of platform policies' },
  { value: 'fraud', label: 'Fraud Identification', labelHi: 'धोखाधड़ी पहचान', icon: AlertTriangle, desc: 'Report fraudulent activity' },
  { value: 'other', label: 'Other', labelHi: 'अन्य', icon: FileText, desc: 'Any other complaint' },
]

export default function ComplaintsPage() {
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
      setMessage(res.message || 'Complaint filed successfully')
      setSubject('')
      setDescription('')
      setContactMobile('')
      setContactEmail('')
      setCategory('')
    } catch (err) {
      setError(err.message || 'Failed to file complaint')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-3xl px-4 py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>File a Complaint</h1>
          <p className='mt-1 text-sm text-gray-500'>
            Report issues related to Legal, Terms & Conditions, Policy of Use, or Fraud Identification.
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
                <span className='text-xs font-semibold text-gray-700'>{c.label}</span>
                <span className='text-[10px] text-gray-400'>{c.labelHi}</span>
              </button>
            )
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-4 rounded-2xl bg-white p-6 shadow-sm'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Subject *</label>
            <input
              type='text'
              required
              minLength={3}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              placeholder='Brief title of your complaint'
            />
          </div>

          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>Description *</label>
            <textarea
              required
              minLength={10}
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              placeholder='Describe the issue in detail...'
            />
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>Mobile (optional)</label>
              <input
                type='tel'
                value={contactMobile}
                onChange={(e) => setContactMobile(e.target.value)}
                className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                placeholder='9876543210'
              />
            </div>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>Email (optional)</label>
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
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>

        {/* Legal info section */}
        <div className='mt-8 space-y-4'>
          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <h2 className='mb-3 text-lg font-bold text-gray-900'>Legal & Policy Information</h2>
            <div className='space-y-3 text-sm text-gray-600'>
              <div>
                <h3 className='font-semibold text-gray-800'>Terms & Conditions</h3>
                <p>By using KisanPatrika, you agree to our platform terms. Sellers must provide accurate product information. Buyers are responsible for verifying product quality before purchase.</p>
              </div>
              <div>
                <h3 className='font-semibold text-gray-800'>Policy of Use</h3>
                <p>This platform is for agricultural trade only. Misuse including spam listings, fake profiles, or unauthorized commercial activity will result in account suspension.</p>
              </div>
              <div>
                <h3 className='font-semibold text-gray-800'>Fraud Identification</h3>
                <p>If you suspect fraudulent activity (fake listings, payment scams, misrepresentation), file a complaint under the Fraud category. Our team investigates all reports within 48 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
