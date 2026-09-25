'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, API_BASE } from '../../lib/api'
import { displayTitle, landRatePerAcre, unitLabel } from '../../lib/product-utils'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const text = {
  en: { title: 'Newly Added Agro Products', qty: 'Qty', new: 'NEW', perAcre: '/acre' },
  hi: { title: 'नए जोड़े गए कृषि उत्पाद', qty: 'मात्रा', new: 'नया', perAcre: '/एकड़' },
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

// Owl-Carousel-style autoplay (the same movement Patanjali's "Best Selling
// Products" uses): the track slides left by ONE card every ~1s with a 200ms
// transition, pauses on hover, and loops seamlessly. The list is duplicated so
// that when the index reaches the end we snap back to 0 with no transition —
// the duplicate tail is identical to the head, so the reset is invisible.
const AUTOPLAY_MS = 1000   // autoplayTimeout
const TRANSITION_MS = 200  // smartSpeed

export default function FeaturedProductsMarquee({ lang = 'hi', onProductClick, title, query = {} }) {
  const t = text[lang] || text.en
  const heading = title ? title[lang] || title.en : t.title
  const [products, setProducts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [index, setIndex] = useState(0)
  const [noTransition, setNoTransition] = useState(false)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(false)
  const [step, setStep] = useState(0)      // px per card (width + gap)
  const [canScroll, setCanScroll] = useState(false)
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const viewportRef = useRef(null)
  const pauseUntil = useRef(0)   // timestamp — manual nav suppresses autoplay briefly

  // Newest approved listings first — the API already filters status='active'
  // for public callers and orders by createdAt DESC.
  useEffect(() => {
    api.getProducts({ limit: String(MAX_ITEMS), page: '1', ...query })
      .then((res) => setProducts(res?.items || []))
      .catch(() => setProducts([]))
      .finally(() => setLoaded(true))
  }, [])

  const n = products.length

  // Measure one card's step (width + gap) and whether the row overflows.
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current
      const viewport = viewportRef.current
      if (!track || !viewport) return
      const first = track.children[0]
      if (!first) return
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '16') || 16
      setStep(first.getBoundingClientRect().width + gap)
      setCanScroll(track.scrollWidth > viewport.clientWidth + 4)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [products.length])

  // Only auto-advance while the section is on screen.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [products.length])

  // Slide forward one card — index may reach n, the duplicated head.
  const goNext = () => setIndex((i) => Math.min(i + 1, n))

  // Slide back one card. From index 0 we first jump to the duplicate tail (n)
  // with no transition — it looks identical to 0 — then slide to n-1, giving a
  // smooth backward step instead of a rewind.
  const goPrev = () => {
    if (index === 0) {
      setNoTransition(true)
      setIndex(n)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setNoTransition(false)
          setIndex(n - 1)
        })
      )
    } else {
      setIndex(index - 1)
    }
  }

  // Manual nav: step once and hold autoplay for a few seconds so it doesn't
  // fight the user's click (Owl pauses autoplay on interaction too).
  const manualNav = (fn) => {
    pauseUntil.current = Date.now() + 3000
    fn()
  }

  // When the index reaches the duplicated head (n), snap back to the real head
  // with no transition — seamless because the duplicate looks identical.
  useEffect(() => {
    if (index !== n || n === 0) return
    const id = setTimeout(() => {
      setNoTransition(true)
      setIndex(0)
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)))
    }, TRANSITION_MS)
    return () => clearTimeout(id)
  }, [index, n])

  // Autoplay: advance one card every AUTOPLAY_MS, unless paused, off-screen,
  // or the user just clicked a nav arrow.
  useEffect(() => {
    if (!canScroll || paused || !inView || n === 0) return
    const id = setInterval(() => {
      if (Date.now() < pauseUntil.current) return
      setIndex((i) => Math.min(i + 1, n))
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [canScroll, paused, inView, n])

  if (!loaded || products.length === 0) return null

  // Duplicate the list so the loop has somewhere to slide into.
  const items = [...products, ...products]

  return (
    <section ref={sectionRef} className='bg-white py-10 md:py-14'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <div className='relative mb-6 flex items-center justify-center'>
          <h2 className='text-center text-2xl font-bold text-gray-900 md:text-3xl'>
            {heading}
          </h2>
          {/* Prev/next nav — top-right, like Patanjali's Owl carousel. Only
              shown when the row actually overflows the viewport. */}
          {canScroll && (
            <div className='absolute right-0 top-1/2 flex -translate-y-1/2 gap-2'>
              <button
                onClick={() => manualNav(goPrev)}
                aria-label='Previous'
                className='rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
              >
                <ChevronLeft className='h-5 w-5' />
              </button>
              <button
                onClick={() => manualNav(goNext)}
                aria-label='Next'
                className='rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
              >
                <ChevronRight className='h-5 w-5' />
              </button>
            </div>
          )}
        </div>
        <div
          ref={viewportRef}
          className='overflow-hidden'
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            className='flex w-max gap-4'
            style={{
              transform: `translateX(-${index * step}px)`,
              transition: noTransition ? 'none' : `transform ${TRANSITION_MS}ms ease`,
            }}
          >
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
