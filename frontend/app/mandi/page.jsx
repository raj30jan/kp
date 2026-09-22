'use client'

import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, MapPin, Search, Calendar, Loader2, RefreshCw, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { api } from '../../lib/api'

export default function MandiPage() {
  const [lang] = useState('hi')
  const isHindi = lang === 'hi'
  const [search, setSearch] = useState('')
  const [selectedState, setSelectedState] = useState('All')
  const [selectedDate, setSelectedDate] = useState('') // YYYY-MM-DD; '' = latest
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('modalPrice')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(24)

  // Native date input gives YYYY-MM-DD; data.gov.in Arrival_Date is DD/MM/YYYY.
  const toApiDate = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  // DD/MM/YYYY → timestamp so dates sort chronologically, not lexically.
  const toTs = (dmy) => {
    if (!dmy) return 0
    const [d, m, y] = dmy.split('/').map(Number)
    return new Date(y, (m || 1) - 1, d || 1).getTime()
  }

  const sortOptions = [
    { value: 'modalPrice', label: isHindi ? 'मोडल भाव' : 'Modal price' },
    { value: 'maxPrice', label: isHindi ? 'अधिकतम भाव' : 'Max price' },
    { value: 'minPrice', label: isHindi ? 'न्यूनतम भाव' : 'Min price' },
    { value: 'commodity', label: isHindi ? 'फसल' : 'Commodity' },
    { value: 'market', label: isHindi ? 'मंडी' : 'Mandi' },
    { value: 'arrivalDate', label: isHindi ? 'तिथि' : 'Date' },
  ]

  // Verified upstream State values — data.gov.in filters are exact-match and
  // case-sensitive, and a few names differ from common usage (Delhi is stored
  // as "NCT of Delhi", Chhattisgarh as "Chattisgarh", Puducherry as
  // "Pondicherry"). 'All' = no server-side state filter.
  const stateOptions = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
    'Chattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'NCT of Delhi',
    'Nagaland', 'Odisha', 'Pondicherry', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal',
  ]
  // Friendlier labels for upstream's non-standard spellings.
  const stateLabels = {
    'NCT of Delhi': 'Delhi',
    Chattisgarh: 'Chhattisgarh',
    Pondicherry: 'Puducherry',
  }
  const states = ['All', ...stateOptions]

  // Fetch real mandi prices via the backend proxy (data.gov.in / AGMARKNET).
  // The state filter is applied server-side; refetch whenever it changes.
  const load = () => {
    setLoading(true)
    setError('')
    api.getMandiRates({
      ...(selectedState !== 'All' ? { state: selectedState } : {}),
      ...(selectedDate ? { date: toApiDate(selectedDate) } : {}),
      limit: 100,
    })
      .then((res) => setRecords(res?.records || []))
      .catch(() => { setRecords([]); setError(isHindi ? 'भाव लोड नहीं हो सके' : 'Could not load mandi rates') })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [selectedState, selectedDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side search across the loaded batch.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return records
    return records.filter((r) =>
      (r.commodity || '').toLowerCase().includes(q) ||
      (r.market || '').toLowerCase().includes(q) ||
      (r.district || '').toLowerCase().includes(q) ||
      (r.variety || '').toLowerCase().includes(q)
    )
  }, [records, search])

  // Client-side sort: numbers numerically, dates via toTs, strings case-insensitive.
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let av = a[sortBy]
      let bv = b[sortBy]
      if (sortBy === 'arrivalDate') {
        av = toTs(av); bv = toTs(bv)
      } else if (typeof av === 'string' || typeof bv === 'string') {
        av = (av || '').toString().toLowerCase()
        bv = (bv || '').toString().toLowerCase()
      } else {
        av = av ?? -Infinity; bv = bv ?? -Infinity
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortBy, sortDir])

  // Client-side pagination over the sorted batch.
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paged = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize]
  )
  const startIdx = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1
  const endIdx = Math.min(page * pageSize, sorted.length)

  // Compact page list: 1 … c-1 c c+1 … last
  const pageNums = useMemo(() => {
    const t = totalPages, c = page, out = []
    if (t <= 7) { for (let i = 1; i <= t; i++) out.push(i); return out }
    out.push(1)
    if (c > 3) out.push('…')
    for (let i = Math.max(2, c - 1); i <= Math.min(t - 1, c + 1); i++) out.push(i)
    if (c < t - 2) out.push('…')
    out.push(t)
    return out
  }, [totalPages, page])

  // Back to page 1 whenever the result set or ordering changes.
  useEffect(() => { setPage(1) }, [search, selectedState, selectedDate, sortBy, sortDir, pageSize])

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
        <div className='mb-6 flex flex-col gap-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <MapPin className='h-5 w-5 text-emerald-600' />
            <div className='relative'>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                title={isHindi ? 'राज्य चुनें' : 'Select state'}
                className='appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              >
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? (isHindi ? 'सभी राज्य' : 'All States') : stateLabels[s] || s}
                  </option>
                ))}
              </select>
              <ChevronRight className='pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-gray-400' />
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='relative min-w-[200px] flex-1 md:max-w-xs'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isHindi ? 'फसल, जिला या मंडी खोजें...' : 'Search commodity, district or mandi...'}
                className='w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              />
            </div>
            <input
              type='date'
              value={selectedDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setSelectedDate(e.target.value)}
              title={isHindi ? 'तिथि चुनें (पुराने भाव)' : 'Pick a date for past rates'}
              className='rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className='rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50'
              >
                {isHindi ? 'नवीनतम' : 'Latest'}
              </button>
            )}
            <div className='relative'>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                title={isHindi ? 'क्रमबद्ध करें' : 'Sort by'}
                className='appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ArrowUpDown className='pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400' />
            </div>
            <button
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              title={isHindi ? 'क्रम बदलें' : 'Toggle sort order'}
              className='rounded-lg bg-white p-2.5 text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50'
            >
              {sortDir === 'asc' ? <ArrowUp className='h-4 w-4' /> : <ArrowDown className='h-4 w-4' />}
            </button>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              title={isHindi ? 'प्रति पृष्ठ' : 'Per page'}
              className='rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
            >
              {[12, 24, 48, 96].map((n) => (
                <option key={n} value={n}>{n}/{isHindi ? 'पृष्ठ' : 'page'}</option>
              ))}
            </select>
            <button
              onClick={load}
              disabled={loading}
              title={isHindi ? 'रीफ्रेश' : 'Refresh'}
              className='rounded-lg bg-white p-2.5 text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50 disabled:opacity-50'
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className='mb-4 flex items-center gap-2 text-sm text-gray-500'>
          <Calendar className='h-4 w-4' />
          {new Date().toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        {/* Rates grid */}
        {loading ? (
          <div className='flex items-center justify-center gap-2 rounded-2xl bg-white p-16 text-gray-500 ring-1 ring-gray-100'>
            <Loader2 className='h-5 w-5 animate-spin text-emerald-600' />
            {isHindi ? 'भाव लोड हो रहे हैं...' : 'Loading live mandi rates...'}
          </div>
        ) : error ? (
          <div className='rounded-2xl bg-white p-16 text-center text-red-500 ring-1 ring-gray-100'>{error}</div>
        ) : paged.length === 0 ? (
          <div className='rounded-2xl bg-white p-16 text-center text-gray-500 ring-1 ring-gray-100'>
            {records.length === 0
              ? (isHindi ? 'कोई भाव नहीं मिला' : 'No rates found')
              : (isHindi
                  ? `"${search}" के लिए लोड किए गए ${records.length} भावों में कोई मेल नहीं`
                  : `No matches for "${search}" in the ${records.length} loaded rates`)}
          </div>
        ) : (
          <>
            <div className='flex flex-col gap-2.5'>
              {paged.map((r, i) => (
                <div key={i} className='mandi-row grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md sm:grid-cols-[1.5fr_1.4fr_auto] sm:items-center'>
                  {/* Commodity + variety */}
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='truncate font-semibold text-gray-900'>{r.commodity}</h3>
                      {r.grade && r.grade !== 'FAQ' && (
                        <span className='shrink-0 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700'>{r.grade}</span>
                      )}
                    </div>
                    {r.variety && <p className='mt-0.5 truncate text-xs text-gray-500'>{r.variety}</p>}
                  </div>

                  {/* Market + location */}
                  <div className='min-w-0'>
                    <div className='flex items-center gap-1.5 text-sm text-gray-700'>
                      <MapPin className='h-3.5 w-3.5 shrink-0 text-emerald-600' />
                      <span className='truncate font-medium'>{r.market}</span>
                    </div>
                    <p className='mt-0.5 truncate pl-5 text-xs text-gray-500'>
                      {[r.district, r.state].filter(Boolean).join(', ')}
                    </p>
                  </div>

                  {/* Prices + date */}
                  <div className='flex items-center gap-5 sm:justify-end'>
                    <div className='text-center'>
                      <div className='text-[10px] font-medium uppercase tracking-wide text-gray-400'>{isHindi ? 'न्यूनतम' : 'Min'}</div>
                      <div className='text-sm font-semibold text-gray-700'>₹{r.minPrice != null ? r.minPrice.toLocaleString('en-IN') : '—'}</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-[10px] font-medium uppercase tracking-wide text-gray-400'>{isHindi ? 'अधिकतम' : 'Max'}</div>
                      <div className='text-sm font-semibold text-gray-700'>₹{r.maxPrice != null ? r.maxPrice.toLocaleString('en-IN') : '—'}</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-[10px] font-medium uppercase tracking-wide text-gray-400'>{isHindi ? 'मोडल' : 'Modal'}</div>
                      <div className='text-lg font-bold text-emerald-700'>₹{r.modalPrice != null ? r.modalPrice.toLocaleString('en-IN') : '—'}</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-[10px] font-medium uppercase tracking-wide text-gray-400'>{isHindi ? 'इकाई' : 'Unit'}</div>
                      <div className='text-xs font-medium text-gray-500'>/{r.unit || 'Quintal'}</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-[10px] font-medium uppercase tracking-wide text-gray-400'>{isHindi ? 'तिथि' : 'Date'}</div>
                      <div className='text-xs font-medium text-gray-500'>{r.arrivalDate || '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className='mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row'>
              <p className='text-sm text-gray-500'>
                {isHindi
                  ? `${sorted.length} में से ${startIdx}–${endIdx} दिखा रहे हैं`
                  : `Showing ${startIdx}–${endIdx} of ${sorted.length}`}
              </p>
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='rounded-lg bg-white p-2 text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50 disabled:opacity-40'
                >
                  <ChevronLeft className='h-4 w-4' />
                </button>
                {pageNums.map((n, i) =>
                  n === '…' ? (
                    <span key={`e${i}`} className='px-2 text-gray-400'>…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`min-w-[2.25rem] rounded-lg px-2 py-1.5 text-sm font-medium ring-1 ${n === page ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-gray-600 ring-gray-200 hover:bg-emerald-50'}`}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className='rounded-lg bg-white p-2 text-gray-600 ring-1 ring-gray-200 hover:bg-emerald-50 disabled:opacity-40'
                >
                  <ChevronRight className='h-4 w-4' />
                </button>
              </div>
            </div>
          </>
        )}

        <p className='mt-4 text-xs text-gray-400'>
          {isHindi
            ? '* लाइव भाव data.gov.in / AGMARKNET (कृषि मंत्रालय) से प्राप्त हैं। वास्तविक भाव के लिए स्थानीय मंडी से संपर्क करें।'
            : '* Live rates sourced from data.gov.in / AGMARKNET (Ministry of Agriculture). Contact local mandi for actual rates.'}
        </p>
      </section>

    </div>
  )
}
