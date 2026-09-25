'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Package, ArrowRight } from 'lucide-react'
import { api, API_BASE } from '../../lib/api'
import { displayTitle, landRatePerAcre, unitLabel } from '../../lib/product-utils'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')
const MAX_ITEMS = 12
const NEW_DAYS = 7

function productImage(p) {
  if (!p.imageUrls) return null
  const imgs = Array.isArray(p.imageUrls) ? p.imageUrls : [p.imageUrls]
  if (imgs.length === 0) return null
  const first = imgs[0]
  if (typeof first === 'string') return BACKEND_URL + first
  if (first?.thumb) return BACKEND_URL + first.thumb
  if (first?.url) return BACKEND_URL + first.url
  return null
}

function isNew(p) {
  if (!p.createdAt) return false
  return Date.now() - new Date(p.createdAt).getTime() < NEW_DAYS * 24 * 60 * 60 * 1000
}

function priceText(p, lang) {
  const rate = landRatePerAcre(p)
  if (rate != null) return `₹${rate.toLocaleString('en-IN')}${lang === 'hi' ? '/एकड़' : '/acre'}`
  const unit = unitLabel(p.priceUnit, lang)
  return `₹${Number(p.price).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`
}

// A single horizontally-scrollable product row for one category/section —
// the Patanjali "Top Featured / Daily & Seasonal" pattern. Fetches its own
// products by the given query ({category} or {group}), shows a "View all"
// link, and self-hides when the section has no listings.
export default function CategoryProductRow({ title, query, viewAllHref, lang = 'hi', onProductClick, accent = 'emerald' }) {
  const [products, setProducts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const params = { ...query, limit: String(MAX_ITEMS), page: '1' }
    api.getProducts(params)
      .then((res) => { if (!cancelled) setProducts(res?.items || []) })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query)])

  const scrollBy = (dir) => scrollRef.current?.scrollBy({ left: dir * 480, behavior: 'smooth' })

  if (!loaded || products.length === 0) return null

  return (
    <section className='py-8 md:py-10'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-gray-900 md:text-2xl'>{title}</h2>
          <button
            onClick={() => onProductClick?.(null, viewAllHref)}
            className='flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800'
          >
            {lang === 'hi' ? 'सभी देखें' : 'View all'}
            <ArrowRight className='h-4 w-4' />
          </button>
        </div>

        <div className='relative'>
          <button
            onClick={() => scrollBy(-1)}
            className='absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md ring-1 ring-gray-200 transition hover:bg-emerald-50 md:block'
            aria-label='Scroll left'
          >
            <ChevronLeft className='h-5 w-5 text-gray-600' />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className='absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md ring-1 ring-gray-200 transition hover:bg-emerald-50 md:block'
            aria-label='Scroll right'
          >
            <ChevronRight className='h-5 w-5 text-gray-600' />
          </button>

          <div
            ref={scrollRef}
            className='flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          >
            {products.map((p) => {
              const img = productImage(p)
              return (
                <button
                  key={p.id}
                  onClick={() => onProductClick?.(p)}
                  className='group flex w-52 shrink-0 flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg'
                >
                  <div className='relative h-36 w-full overflow-hidden bg-gray-100'>
                    {img ? (
                      <Image
                        src={img}
                        alt={p.title}
                        fill
                        unoptimized
                        className='object-cover transition group-hover:scale-105'
                        sizes='208px'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-gray-300'>
                        <Package className='h-10 w-10' />
                      </div>
                    )}
                    {isNew(p) && (
                      <span className='absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow'>
                        {lang === 'hi' ? 'नया' : 'NEW'}
                      </span>
                    )}
                  </div>
                  <div className='flex flex-1 flex-col gap-1 p-3'>
                    <h3 className='truncate text-sm font-semibold text-gray-900'>{displayTitle(p, lang)}</h3>
                    <div className='flex items-center justify-between'>
                      <span className='text-base font-bold text-emerald-700'>{priceText(p, lang)}</span>
                      {p.quantity != null && p.quantity !== '' && (
                        <span className='flex items-center gap-1 text-xs text-gray-500'>
                          <Package className='h-3 w-3' />
                          {p.quantity} {unitLabel(p.quantityUnit, lang)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
