'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { api, API_BASE } from '../../lib/api'
import {
  Search,
  MapPin,
  IndianRupee,
  ShoppingCart,
  ChevronDown,
  Loader2,
  ArrowLeft,
  Plus,
} from 'lucide-react'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

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

const CATEGORY_LABELS = {
  crops: 'Crops',
  vegetables: 'Vegetables',
  fruits: 'Fruits',
  seeds: 'Seeds',
  tools: 'Tools / Equipment',
  fertilizers: 'Fertilizers / Pesticides',
  livestock: 'Livestock',
  dairy: 'Dairy Products',
  other: 'Other',
}

function MarketplaceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: searchParams?.get('category') || '',
    q: searchParams?.get('q') || '',
    state: searchParams?.get('state') || '',
    district: searchParams?.get('district') || '',
  })

  useEffect(() => {
    loadProducts()
  }, [filters])

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
          <button onClick={() => router.push('/')} className='flex items-center gap-2'>
            <ArrowLeft className='h-5 w-5 text-emerald-700' />
            <Image src='/logo.png' alt='KisanPatrika' width={140} height={44} className='h-9 w-auto' />
          </button>

          <form onSubmit={handleSearch} className='hidden flex-1 md:block'>
            <div className='relative mx-auto max-w-xl'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                placeholder='Search seeds, tools, crops, vegetables...'
                className='w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              />
            </div>
          </form>

          <Link
            href='/sell'
            className='flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'
          >
            <Plus className='h-4 w-4' /> Sell
          </Link>
        </div>

        <form onSubmit={handleSearch} className='block border-t border-gray-100 p-3 md:hidden'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder='Search products...'
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
              <option value=''>All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          </div>

          <input
            type='text'
            value={filters.state}
            onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            placeholder='State'
            className='rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500'
          />
          <input
            type='text'
            value={filters.district}
            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
            placeholder='District'
            className='rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500'
          />

          {(filters.category || filters.q || filters.state || filters.district) && (
            <button onClick={clearFilters} className='text-sm font-medium text-emerald-700 hover:text-emerald-800'>
              Clear filters
            </button>
          )}
        </div>

        <div className='mt-6 flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-gray-900 md:text-3xl'>Buy Farm Products</h1>
          <span className='text-sm text-gray-500'>{products.length} listings</span>
        </div>

        {loading ? (
          <div className='mt-10 flex h-64 items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
          </div>
        ) : products.length === 0 ? (
          <div className='mt-10 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100'>
            <ShoppingCart className='mx-auto h-12 w-12 text-gray-300' />
            <h3 className='mt-4 text-lg font-semibold text-gray-900'>No products found</h3>
            <p className='mt-1 text-sm text-gray-500'>Try a different search or be the first seller.</p>
            <Link
              href='/sell'
              className='mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
            >
              Sell your product
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
                      alt={p.title}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center text-gray-400'>
                      <ShoppingCart className='h-10 w-10' />
                    </div>
                  )}
                  <span className='absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white'>
                    {CATEGORY_LABELS[p.category] || p.category || 'Product'}
                  </span>
                </div>

                <div className='flex flex-1 flex-col p-4'>
                  <h3 className='text-base font-bold text-gray-900'>{p.title}</h3>
                  <p className='mt-1 line-clamp-2 text-sm text-gray-500'>{p.description || 'No description'}</p>

                  <div className='mt-3 flex items-center gap-1 text-lg font-bold text-emerald-700'>
                    <IndianRupee className='h-4 w-4' />
                    {p.price}
                    <span className='text-sm font-normal text-gray-500'>{p.priceUnit ? p.priceUnit.replace(/_/g, ' ') : ''}</span>
                  </div>

                  <div className='mt-2 flex items-center gap-1 text-xs text-gray-500'>
                    <MapPin className='h-3.5 w-3.5' />
                    {p.location || [p.district, p.state].filter(Boolean).join(', ') || 'Location not set'}
                  </div>

                  <div className='mt-4 flex items-center justify-between'>
                    <span className='text-xs text-gray-400'>{p.quantity ? `${p.quantity} ${p.quantityUnit || ''}` : ''}</span>
                    <span className='rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'>
                      View Details
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
