'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api, API_BASE } from '../../lib/api'
import { useLang } from '../../lib/lang-context'
import { displayTitle, unitLabel, landRatePerAcre } from '../../lib/product-utils'
import {
  Search,
  MapPin,
  IndianRupee,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Plus,
} from 'lucide-react'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const t = {
  en: {
    searchPlaceholder: 'Search in English, हिंदी or Hinglish...',
    searchPlaceholderMobile: 'Search English / हिंदी / Hinglish...',
    allCategories: 'All Categories',
    state: 'State',
    district: 'District',
    clearFilters: 'Clear filters',
    title: 'Buy Farm Products',
    breadcrumb: 'Marketplace',
    home: 'Home',
    listings: 'listings',
    noProducts: 'No products found',
    noProductsSub: 'Try a different search or be the first seller.',
    sellCta: 'Sell',
    sell: 'Sell your product',
    viewDetails: 'View Details',
    noDescription: 'No description',
    locationNotSet: 'Location not set',
    product: 'Product',
    largeParcelBadge: 'Large Parcel',
    newBadge: 'New',
    totalLabel: 'Total',
    perAcre: 'per acre',
  },
  hi: {
    searchPlaceholder: 'बीज, उपकरण, फसलें, सब्जियाँ खोजें...',
    searchPlaceholderMobile: 'उत्पाद खोजें...',
    allCategories: 'सभी श्रेणियाँ',
    state: 'राज्य',
    district: 'जिला',
    clearFilters: 'फिल्टर हटाएँ',
    title: 'कृषि उत्पाद खरीदें',
    breadcrumb: 'मार्केटप्लेस',
    home: 'होम',
    listings: 'सूची',
    noProducts: 'कोई उत्पाद नहीं मिला',
    noProductsSub: 'अलग खोज करें या पहले विक्रेता बनें।',
    sellCta: 'बेचें',
    sell: 'अपना उत्पाद बेचें',
    viewDetails: 'विवरण देखें',
    noDescription: 'कोई विवरण नहीं',
    locationNotSet: 'स्थान सेट नहीं',
    product: 'उत्पाद',
    largeParcelBadge: 'बड़ा भूखंड',
    newBadge: 'नया',
    totalLabel: 'कुल',
    perAcre: 'प्रति एकड़',
  },
}

// Products listed within the last 7 days get a "New" badge — reinforces
// that the default view is sorted by added date (newest first).
const NEW_DAYS = 7
function isNewListing(p) {
  if (!p.createdAt) return false
  return Date.now() - new Date(p.createdAt).getTime() < NEW_DAYS * 24 * 3600 * 1000
}

function productImage(p) {
  if (!p.imageUrls) return null
  const imgs = Array.isArray(p.imageUrls) ? p.imageUrls : [p.imageUrls]
  if (imgs.length === 0) return null
  const first = imgs[0]
  if (typeof first === 'string') return BACKEND_URL + first
  if (first?.thumb) return BACKEND_URL + first.thumb
  if (first?.full) return BACKEND_URL + first.full
  return null
}

function flattenCategories(nodes, lang, level = 0, acc = []) {
  for (const n of nodes || []) {
    const name = lang === 'hi' ? (n.nameHi || n.name) : n.name
    acc.push({ key: n.slug, label: '— '.repeat(level) + name })
    if (n.children?.length) flattenCategories(n.children, lang, level + 1, acc)
  }
  return acc
}

function MarketplaceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { lang } = useLang()
  const text = t[lang]
  const [categoryOptions, setCategoryOptions] = useState([])
  const [locations, setLocations] = useState([]) // [{name, districts: []}]
  const categoryNameMap = useMemo(() => {
    const map = {}
    for (const c of categoryOptions) map[c.key] = c.label
    return map
  }, [categoryOptions])
  const [filters, setFilters] = useState({
    category: searchParams?.get('category') || '',
    q: searchParams?.get('q') || '',
    state: searchParams?.get('state') || '',
    district: searchParams?.get('district') || '',
  })
  // District dropdown follows the selected state; with no state it lists
  // every district that has an active listing.
  const districtOptions = useMemo(() => {
    if (filters.state) {
      const st = locations.find((l) => l.name === filters.state)
      return st ? [...new Set(st.districts)] : []
    }
    return [...new Set(locations.flatMap((l) => l.districts))].sort()
  }, [locations, filters.state])

  useEffect(() => {
    loadProducts()
  }, [filters])

  useEffect(() => {
    api.getCategoryTree()
      .then((res) => setCategoryOptions(flattenCategories(res?.tree || [], lang)))
      .catch(() => setCategoryOptions([]))
  }, [lang])

  useEffect(() => {
    api.getLocations()
      .then((res) => setLocations(res?.states || []))
      .catch(() => setLocations([]))
  }, [])

  const isLargeParcel = (p) =>
    (p.category === 'land' || (p.category || '').startsWith('land-')) &&
    p.quantityUnit === 'acre' &&
    Number(p.quantity) > 10

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.category) params.category = filters.category
      if (filters.q) params.q = filters.q
      if (filters.state) params.state = filters.state
      if (filters.district) params.district = filters.district
      const res = await api.getProducts(params)
      setProducts(res?.items || [])
    } catch (err) {
      console.error(err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadProducts()
  }

  const clearFilters = () => {
    setFilters({ category: '', q: '', state: '', district: '' })
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='sticky top-0 z-50 border-b bg-white/95 backdrop-blur'>
        <div className='mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6'>
          <div className='flex items-center gap-2'>
            <button onClick={() => router.push('/')} className='rounded-full p-1.5 hover:bg-gray-100'>
              <ArrowLeft className='h-5 w-5 text-emerald-700' />
            </button>
            <div className='flex items-center gap-1 text-sm'>
              <Link href='/' className='text-gray-600 hover:text-emerald-700'>{text.home}</Link>
              <ChevronRight className='h-4 w-4 text-gray-400' />
              <span className='font-medium text-emerald-700'>{text.breadcrumb}</span>
            </div>
          </div>

          <form onSubmit={handleSearch} className='hidden flex-1 md:block'>
            <div className='relative mx-auto max-w-xl'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                placeholder={text.searchPlaceholder}
                className='w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              />
            </div>
          </form>

          <Link
            href='/sell'
            className='flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'
          >
            <Plus className='h-4 w-4' /> {text.sellCta}
          </Link>
        </div>

        <form onSubmit={handleSearch} className='block border-t border-gray-100 p-3 md:hidden'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder={text.searchPlaceholderMobile}
              className='w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500'
            />
          </div>
        </form>
      </header>

      <main className='mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10'>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative'>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className='appearance-none rounded-full border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm outline-none focus:border-emerald-500'
            >
              <option value=''>{text.allCategories}</option>
              {categoryOptions.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          </div>

          {/* Cascading location dropdowns — only states/districts that
              actually have listings are offered, so the filter can't
              produce a dead-end empty result. */}
          <div className='relative'>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value, district: '' })}
              className='appearance-none rounded-full border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm outline-none focus:border-emerald-500'
            >
              <option value=''>{text.state}</option>
              {locations.map((l) => (
                <option key={l.name} value={l.name}>{l.name}</option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          </div>
          <div className='relative'>
            <select
              value={filters.district}
              onChange={(e) => setFilters({ ...filters, district: e.target.value })}
              className='appearance-none rounded-full border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm outline-none focus:border-emerald-500'
            >
              <option value=''>{text.district}</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          </div>

          {(filters.category || filters.q || filters.state || filters.district) && (
            <button onClick={clearFilters} className='text-sm font-medium text-emerald-700 hover:text-emerald-800'>
              {text.clearFilters}
            </button>
          )}
        </div>

        <div className='mt-6 flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-gray-900 md:text-3xl'>{text.title}</h1>
          <span className='text-sm text-gray-500'>{products.length} {text.listings}</span>
        </div>

        {loading ? (
          <div className='mt-10 flex h-64 items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
          </div>
        ) : products.length === 0 ? (
          <div className='mt-10 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100'>
            <ShoppingCart className='mx-auto h-12 w-12 text-gray-300' />
            <h3 className='mt-4 text-lg font-semibold text-gray-900'>{text.noProducts}</h3>
            <p className='mt-1 text-sm text-gray-500'>{text.noProductsSub}</p>
            <Link
              href='/sell'
              className='mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
            >
              {text.sell}
            </Link>
          </div>
        ) : (
          <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/marketplace/${p.id}`}
                className='group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-lg hover:ring-emerald-200'
              >
                <div className='relative h-48 bg-gray-100'>
                  {productImage(p) ? (
                    <img
                      src={productImage(p)}
                      alt={displayTitle(p, lang)}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center text-gray-400'>
                      <ShoppingCart className='h-10 w-10' />
                    </div>
                  )}
                  <span className='absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white'>
                    {categoryNameMap[p.category] || p.category || text.product}
                  </span>
                  {isLargeParcel(p) && (
                    <span className='absolute right-3 top-3 rounded-full bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white'>
                      {text.largeParcelBadge}
                    </span>
                  )}
                  {isNewListing(p) && (
                    <span className='absolute bottom-3 left-3 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white'>
                      {text.newBadge}
                    </span>
                  )}
                </div>

                <div className='flex flex-1 flex-col p-4'>
                  <h3 className='text-base font-bold text-gray-900'>{displayTitle(p, lang)}</h3>
                  <p className='mt-1 line-clamp-2 text-sm text-gray-500'>{p.description || text.noDescription}</p>

                  {(() => {
                    const perAcre = landRatePerAcre(p)
                    if (perAcre) {
                      // Land listings are priced per acre — show the rate
                      // prominently with the total as secondary context.
                      return (
                        <div className='mt-3'>
                          <div className='flex items-center gap-1 text-lg font-bold text-emerald-700'>
                            <IndianRupee className='h-4 w-4' />
                            {perAcre.toLocaleString('en-IN')}
                            <span className='text-sm font-normal text-gray-500'>{text.perAcre}</span>
                          </div>
                          <p className='text-xs text-gray-500'>{text.totalLabel}: ₹{Number(p.price).toLocaleString('en-IN')}</p>
                        </div>
                      )
                    }
                    return (
                      <div className='mt-3 flex items-center gap-1 text-lg font-bold text-emerald-700'>
                        <IndianRupee className='h-4 w-4' />
                        {p.price}
                        <span className='text-sm font-normal text-gray-500'>{unitLabel(p.priceUnit, lang)}</span>
                      </div>
                    )
                  })()}

                  <div className='mt-2 flex items-center gap-1 text-xs text-gray-500'>
                    <MapPin className='h-3.5 w-3.5' />
                    {p.location || [p.district, p.state].filter(Boolean).join(', ') || text.locationNotSet}
                  </div>

                  <div className='mt-4 flex items-center justify-between'>
                    <span className='text-xs text-gray-400'>{p.quantity ? `${p.quantity} ${unitLabel(p.quantityUnit, lang)}` : ''}</span>
                    <span className='rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'>
                      {text.viewDetails}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-slate-50' />}>
      <MarketplaceContent />
    </Suspense>
  )
}
