'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'
import { api, API_BASE } from '../../lib/api'
import { displayTitle, landRatePerAcre, unitLabel } from '../../lib/product-utils'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const text = {
  en: { title: 'Newly Added Products', qty: 'Qty', new: 'NEW', perAcre: '/acre' },
  hi: { title: 'नए जोड़े गए उत्पाद', qty: 'मात्रा', new: 'नया', perAcre: '/एकड़' },
}

// Products listed within this window get the NEW badge.
const NEW_DAYS = 7
// Marquee shows only the newest approved listings.
const MAX_ITEMS = 20

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

function priceText(p, lang, t) {
  const rate = landRatePerAcre(p)
  if (rate != null) return `₹${rate.toLocaleString('en-IN')}${t.perAcre}`
  const unit = unitLabel(p.priceUnit, lang)
  return `₹${Number(p.price).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`
}

// Doubling the list gives a seamless, continuous scroll loop (see .marquee-track
// keyframes in globals.css, which translates exactly -50%).
// The animation is paused until the section scrolls into the viewport —
// IntersectionObserver toggles .marquee-active on the track.
export default function FeaturedProductsMarquee({ lang = 'en', onProductClick }) {
  const t = text[lang] || text.en
  const [products, setProducts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const sectionRef = useRef(null)
  const trackRef = useRef(null)

  // Newest approved listings first — the API already filters status='active'
  // for public callers and orders by createdAt DESC.
  useEffect(() => {
    api.getProducts({ limit: String(MAX_ITEMS), page: '1' })
      .then((res) => setProducts(res?.items || []))
      .catch(() => setProducts([]))
      .finally(() => setLoaded(true))
  }, [])

  // Start/stop the marquee with visibility: animation runs only while the
  // section is on screen, so it begins moving exactly when the user can see it.
  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return
    const observer = new IntersectionObserver(
      ([entry]) => track.classList.toggle('marquee-active', entry.isIntersecting),
      { threshold: 0.15 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [products.length])

  if (!loaded || products.length === 0) return null

  const items = [...products, ...products]

  return (
    <section ref={sectionRef} className='bg-white py-10 md:py-14'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <h2 className='mb-6 text-center text-2xl font-bold text-gray-900 md:text-3xl'>
          {t.title}
        </h2>
        <div className='overflow-hidden'>
          <div ref={trackRef} className='marquee-track flex w-max gap-4'>
            {items.map((p, idx) => {
              const img = productImage(p)
              return (
                <button
                  key={`${p.id}-${idx}`}
                  onClick={() => onProductClick?.(p)}
                  className='group flex w-56 shrink-0 flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg'
                >
                  <div className='relative h-36 w-full overflow-hidden bg-gray-100'>
                    {img ? (
                      <Image
                        src={img}
                        alt={p.title}
                        fill
                        unoptimized
                        className='object-cover transition group-hover:scale-105'
                        sizes='224px'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-gray-300'>
                        <Package className='h-10 w-10' />
                      </div>
                    )}
                    {isNew(p) && (
                      <span className='absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow'>
                        {t.new}
                      </span>
                    )}
                  </div>
                  <div className='flex flex-1 flex-col gap-1 p-3'>
                    <h3 className='truncate text-sm font-semibold text-gray-900'>{displayTitle(p, lang)}</h3>
                    <div className='flex items-center justify-between'>
                      <span className='text-base font-bold text-emerald-700'>{priceText(p, lang, t)}</span>
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
