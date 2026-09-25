'use client'

import { TrendingUp } from 'lucide-react'

// Patanjali-style "Most Searched" ranked chips — quick one-tap searches that
// route to the marketplace with the query prefilled.
const DEFAULT_TERMS = [
  { en: 'Tomato', hi: 'टमाटर' },
  { en: 'Onion', hi: 'प्याज़' },
  { en: 'Wheat', hi: 'गेहूँ' },
  { en: 'Tractor', hi: 'ट्रैक्टर' },
  { en: 'Land', hi: 'भूमि' },
  { en: 'Seeds', hi: 'बीज' },
  { en: 'Cow', hi: 'गाय' },
  { en: 'Ghee', hi: 'घी' },
  { en: 'Pesticide', hi: 'कीटनाशक' },
  { en: 'Rice', hi: 'चावल' },
]

export default function MostSearched({ lang = 'hi', onSearch, terms = DEFAULT_TERMS }) {
  return (
    <section className='bg-white py-8'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <div className='mb-4 flex items-center gap-2'>
          <TrendingUp className='h-5 w-5 text-emerald-600' />
          <h2 className='text-lg font-bold text-gray-900 md:text-xl'>
            {lang === 'hi' ? 'सबसे ज़्यादा खोजे गए' : 'Most Searched'}
          </h2>
        </div>
        <div className='flex flex-wrap gap-2'>
          {terms.map((term, i) => (
            <button
              key={term.en}
              onClick={() => onSearch?.(term.en)}
              className='flex items-center gap-1.5 rounded-full border border-gray-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800'
            >
              <span className='text-xs font-bold text-emerald-600'>#{i + 1}</span>
              {lang === 'hi' ? term.hi : term.en}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
