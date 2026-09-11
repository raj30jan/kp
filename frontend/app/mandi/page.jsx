'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, MapPin, Search, Calendar } from 'lucide-react'

export default function MandiPage() {
  const [lang, setLang] = useState('en')
  const isHindi = lang === 'hi'
  const [search, setSearch] = useState('')
  const [selectedState, setSelectedState] = useState('All')

  const states = ['All', 'Punjab', 'Haryana', 'UP', 'Rajasthan', 'MP', 'Bihar', 'Maharashtra']

  const rates = [
    { crop: isHindi ? 'गेहूं' : 'Wheat', variety: 'HD-2967', state: 'Punjab', mandi: 'Ludhiana', min: 2120, max: 2240, avg: 2180, unit: '₹/quintal', trend: 'up', change: +2.3 },
    { crop: isHindi ? 'धान' : 'Paddy', variety: 'PR-121', state: 'Punjab', mandi: 'Amritsar', min: 2040, max: 2160, avg: 2100, unit: '₹/quintal', trend: 'down', change: -1.1 },
    { crop: isHindi ? 'सरसों' : 'Mustard', variety: 'Pusa Bold', state: 'Haryana', mandi: 'Hisar', min: 5180, max: 5320, avg: 5250, unit: '₹/quintal', trend: 'up', change: +3.5 },
    { crop: isHindi ? 'मक्का' : 'Maize', variety: 'Hybrid', state: 'UP', mandi: 'Meerut', min: 1820, max: 1960, avg: 1890, unit: '₹/quintal', trend: 'up', change: +1.8 },
    { crop: isHindi ? 'सोयाबीन' : 'Soybean', variety: 'JS-335', state: 'MP', mandi: 'Indore', min: 4480, max: 4620, avg: 4550, unit: '₹/quintal', trend: 'down', change: -0.9 },
    { crop: isHindi ? 'चना' : 'Chana', variety: 'JG-11', state: 'Rajasthan', mandi: 'Kota', min: 5120, max: 5280, avg: 5200, unit: '₹/quintal', trend: 'up', change: +1.2 },
    { crop: isHindi ? 'मूंग' : 'Moong', variety: 'Green Gold', state: 'Maharashtra', mandi: 'Pune', min: 7280, max: 7520, avg: 7400, unit: '₹/quintal', trend: 'up', change: +4.2 },
    { crop: isHindi ? 'उरद' : 'Urad', variety: 'Black', state: 'Bihar', mandi: 'Patna', min: 6800, max: 7100, avg: 6950, unit: '₹/quintal', trend: 'down', change: -2.1 },
    { crop: isHindi ? 'बाजरा' : 'Bajra', variety: 'Hybrid', state: 'Rajasthan', mandi: 'Jaipur', min: 2250, max: 2380, avg: 2315, unit: '₹/quintal', trend: 'up', change: +0.8 },
    { crop: isHindi ? 'ज्वार' : 'Jowar', variety: 'CSV-15', state: 'Maharashtra', mandi: 'Aurangabad', min: 2980, max: 3120, avg: 3050, unit: '₹/quintal', trend: 'down', change: -1.5 },
  ]

  const filtered = useMemo(() => {
    return rates.filter((r) => {
      const matchesState = selectedState === 'All' || r.state === selectedState
      const matchesSearch = r.crop.toLowerCase().includes(search.toLowerCase()) || r.mandi.toLowerCase().includes(search.toLowerCase())
      return matchesState && matchesSearch
    })
  }, [selectedState, search])

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='bg-gradient-to-br from-amber-950 via-amber-900 to-orange-800 py-16 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <TrendingUp className='mx-auto mb-4 h-12 w-12 text-amber-300' />
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl'>
            {isHindi ? 'मंडी भाव' : 'Mandi Rates'}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-amber-100'>
            {isHindi ? 'भारत भर के प्रमुख मंडियों के दैनिक भाव' : 'Daily rates from major mandis across India'}
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-4 py-12 md:px-6'>
        {/* Filters */}
        <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <MapPin className='h-5 w-5 text-emerald-600' />
            {states.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedState(s)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${selectedState === s ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className='relative w-full md:max-w-xs'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isHindi ? 'फसल या मंडी खोजें...' : 'Search crop or mandi...'}
              className='w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            />
          </div>
        </div>

        <div className='mb-4 flex items-center gap-2 text-sm text-gray-500'>
          <Calendar className='h-4 w-4' />
          {new Date().toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {/* Rates table */}
        <div className='overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50 text-left'>
                <tr>
                  <th className='px-4 py-3 font-semibold text-gray-700'>{isHindi ? 'फसल' : 'Crop'}</th>
                  <th className='px-4 py-3 font-semibold text-gray-700'>{isHindi ? 'किस्म' : 'Variety'}</th>
                  <th className='px-4 py-3 font-semibold text-gray-700'>{isHindi ? 'राज्य' : 'State'}</th>
                  <th className='px-4 py-3 font-semibold text-gray-700'>{isHindi ? 'मंडी' : 'Mandi'}</th>
                  <th className='px-4 py-3 text-right font-semibold text-gray-700'>{isHindi ? 'न्यूनतम' : 'Min'}</th>
                  <th className='px-4 py-3 text-right font-semibold text-gray-700'>{isHindi ? 'अधिकतम' : 'Max'}</th>
                  <th className='px-4 py-3 text-right font-semibold text-gray-700'>{isHindi ? 'औसत' : 'Avg'}</th>
                  <th className='px-4 py-3 text-right font-semibold text-gray-700'>{isHindi ? 'बदलाव' : 'Change'}</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100'>
                {filtered.map((r, i) => (
                  <tr key={i} className='hover:bg-emerald-50/50'>
                    <td className='px-4 py-3 font-medium text-gray-900'>{r.crop}</td>
                    <td className='px-4 py-3 text-gray-600'>{r.variety}</td>
                    <td className='px-4 py-3 text-gray-600'>{r.state}</td>
                    <td className='px-4 py-3 text-gray-600'>{r.mandi}</td>
                    <td className='px-4 py-3 text-right text-gray-600'>₹{r.min.toLocaleString()}</td>
                    <td className='px-4 py-3 text-right text-gray-600'>₹{r.max.toLocaleString()}</td>
                    <td className='px-4 py-3 text-right font-bold text-emerald-700'>₹{r.avg.toLocaleString()}</td>
                    <td className='px-4 py-3 text-right'>
                      <span className={`inline-flex items-center gap-1 font-semibold ${r.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                        {r.trend === 'up' ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}
                        {r.change > 0 ? '+' : ''}{r.change}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className='p-10 text-center text-gray-500'>
              {isHindi ? 'कोई भाव नहीं मिला' : 'No rates found'}
            </div>
          )}
        </div>

        <p className='mt-4 text-xs text-gray-400'>
          {isHindi
            ? '* भाव सूचना विभिन्न मंडी बोर्डों से प्राप्त है। वास्तविक भाव के लिए स्थानीय मंडी से संपर्क करें।'
            : '* Rates are sourced from various mandi boards. Contact local mandi for actual rates.'}
        </p>
      </section>

    </div>
  )
}
