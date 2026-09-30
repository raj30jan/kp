'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Tag, PawPrint, ChevronLeft, ChevronRight, MapPin, IndianRupee } from 'lucide-react'
import { api, API_BASE } from '../../lib/api'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

// Animal buy/sell section — modelled on animall.in: a horizontally scrolling
// row of animal category cards that AUTO-ADVANCES one card per second (the
// same Owl-style movement as the "Newly Added" carousels), pauses on hover,
// loops seamlessly, and has prev/next arrows. Tapping a card opens the
// marketplace filtered to that animal; the banner below is a sell CTA.
const text = {
  en: {
    title: 'Buy & Sell Animals',
    subtitle: 'Find verified cattle, goats, poultry and more — or list your own animal for sale.',
    viewAll: 'View all animals',
    sell: 'Sell Your Animal',
    sellDesc: 'List your animal free — reach thousands of buyers.',
  },
  hi: {
    title: 'पशु खरीदें और बेचें',
    subtitle: 'सत्यापित मवेशी, बकरी, पोल्ट्री और अधिक खोजें — या अपना पशु बिक्री के लिए सूचीबद्ध करें।',
    viewAll: 'सभी पशु देखें',
    sell: 'अपना पशु बेचें',
    sellDesc: 'अपना पशु मुफ्त सूचीबद्ध करें — हज़ारों खरीदारों तक पहुँचें।',
  },
}

// Each card routes to the animals section of the marketplace with a search
// term so the listing opens pre-filtered to that animal type.
const ANIMALS = [
  { key: 'cow', en: 'Cow', hi: 'गाय', q: 'cow', img: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=70' },
  { key: 'buffalo', en: 'Buffalo', hi: 'भैंस', q: 'buffalo', img: 'https://images.unsplash.com/photo-1605152276897-4f618f831968?auto=format&fit=crop&w=600&q=70' },
  { key: 'goat', en: 'Goat', hi: 'बकरी', q: 'goat', img: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=600&q=70' },
  { key: 'sheep', en: 'Sheep', hi: 'भेड़', q: 'sheep', img: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=600&q=70' },
  { key: 'horse', en: 'Horse', hi: 'घोड़ा', q: 'horse', img: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=600&q=70' },
  { key: 'poultry', en: 'Poultry', hi: 'पोल्ट्री', q: 'poultry', img: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=70' },
  { key: 'camel', en: 'Camel', hi: 'ऊँट', q: 'camel', img: 'https://images.unsplash.com/photo-1547235001-d703406d3f17?auto=format&fit=crop&w=600&q=70' },
  { key: 'fish', en: 'Fish', hi: 'मछली', q: 'fish', img: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=600&q=70' },
  { key: 'other', en: 'Other Animals', hi: 'अन्य पशु', q: '', img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=70' },
]

const AUTOPLAY_MS = 1000   // autoplayTimeout — one card per second
const TRANSITION_MS = 200  // smartSpeed
const LISTINGS_LIMIT = 20  // newest listings shown in this section

// Fallback photo by animal-type code when a listing has no uploaded image.
const TYPE_IMG = ANIMALS.reduce((m, a) => ({ ...m, [a.key]: a.img }), {})

export default function AnimalSection({ lang = 'hi', onSelect, onSell }) {
  const t = text[lang] || text.en
  const [index, setIndex] = useState(0)
  const [noTransition, setNoTransition] = useState(false)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(false)
  const [step, setStep] = useState(0)
  const [canScroll, setCanScroll] = useState(false)
  // null = still loading; [] = loaded but no live listings (fallback shows)
  const [listings, setListings] = useState(null)
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const viewportRef = useRef(null)
  const pauseUntil = useRef(0)

  // Pull the newest 20 approved animal listings for the carousel.
  useEffect(() => {
    api.getAnimals({ sort: 'newest', limit: LISTINGS_LIMIT })
      .then((res) => setListings(res?.items || []))
      .catch(() => setListings([]))
  }, [])

  // Live listings win; the static category row is the loading/empty fallback.
  const cards = listings && listings.length ? listings : ANIMALS
  const isLive = !!(listings && listings.length)
  const n = cards.length

  // Measure one card's step (width + gap) and whether the row overflows.
  // Re-runs when the card set changes (fallback -> live listings).
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
    setIndex(0)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [n])

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
  }, [])

  const goNext = () => setIndex((i) => Math.min(i + 1, n))

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

  const manualNav = (fn) => {
    pauseUntil.current = Date.now() + 3000
    fn()
  }

  // Snap back to the real head when the index reaches the duplicated head.
  useEffect(() => {
    if (index !== n || n === 0) return
    const id = setTimeout(() => {
      setNoTransition(true)
      setIndex(0)
      requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)))
    }, TRANSITION_MS)
    return () => clearTimeout(id)
  }, [index, n])

  // Autoplay: advance one card every AUTOPLAY_MS unless paused/off-screen/just clicked.
  useEffect(() => {
    if (!canScroll || paused || !inView || n === 0) return
    const id = setInterval(() => {
      if (Date.now() < pauseUntil.current) return
      setIndex((i) => Math.min(i + 1, n))
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [canScroll, paused, inView, n])

  // Duplicate the list so the loop has somewhere to slide into — but only
  // when the row actually overflows; otherwise each card would show twice.
  const items = canScroll ? [...cards, ...cards] : cards

  const imgFor = (l) => {
    const u = l.images?.[0]?.thumbUrl || l.images?.[0]?.imageUrl
    return u ? `${BACKEND_URL}${u}` : TYPE_IMG[l.type?.code] || TYPE_IMG.other
  }
  const labelFor = (l) => l.title || (lang === 'hi' ? l.type?.nameHi || l.type?.name : l.type?.name) || 'Animal'
  const metaFor = (l) =>
    [l.type?.name, l.breed?.name].filter(Boolean).join(' · ')
  const placeFor = (l) => [l.district, l.state].filter(Boolean).join(', ') || l.location || ''
  // Buyer-critical facts: age, daily milk yield, pregnancy.
  const factsFor = (l) => {
    const hi = lang === 'hi'
    const out = []
    const y = Number(l.ageYears || 0)
    const m = Number(l.ageMonths || 0)
    if (y || m) out.push([y ? `${y}${hi ? ' वर्ष' : 'y'}` : '', m ? `${m}${hi ? ' माह' : 'm'}` : ''].filter(Boolean).join(' '))
    if (Number(l.milkCapacity) > 0) out.push(`${Number(l.milkCapacity)} ${hi ? 'ली/दिन' : 'L/day'}`)
    if (Number(l.isPregnant) === 1) out.push(hi ? 'गाभिन' : 'Pregnant')
    return out
  }

  return (
    <section ref={sectionRef} className='bg-white py-16'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        {/* Header + top-right nav arrows */}
        <div className='relative mb-8 text-center'>
          <span className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800'>
            <PawPrint className='h-4 w-4' />
            {lang === 'hi' ? 'पशु बाज़ार' : 'Animal Market'}
          </span>
          <h2 className='mt-4 text-3xl font-bold text-gray-900 md:text-4xl'>{t.title}</h2>
          <p className='mx-auto mt-3 max-w-2xl text-gray-600'>{t.subtitle}</p>
          {canScroll && (
            <div className='absolute right-0 top-1/2 hidden -translate-y-1/2 gap-2 md:flex'>
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

        {/* Auto-advancing animal cards */}
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
            {items.map((a, idx) =>
              isLive ? (
                /* Live animal listing card — photo, title, type/breed, price, place */
                <button
                  key={`${a.id}-${idx}`}
                  onClick={() => onSelect?.({ q: a.type?.name || '', id: a.id })}
                  className='group flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg md:w-52'
                >
                  <div className='relative h-32 w-full overflow-hidden bg-gray-100 md:h-36'>
                    <Image
                      src={imgFor(a)}
                      alt={labelFor(a)}
                      fill
                      className='object-cover transition duration-300 group-hover:scale-105'
                      sizes='(max-width:768px) 44vw, 208px'
                      unoptimized
                    />
                  </div>
                  <div className='flex flex-1 flex-col px-3 py-3'>
                    <span className='line-clamp-1 text-sm font-bold text-gray-900 md:text-base'>
                      {labelFor(a)}
                    </span>
                    <span className='mt-0.5 line-clamp-1 text-xs text-gray-500'>{metaFor(a)}</span>
                    {factsFor(a).length > 0 && (
                      <span className='mt-1.5 flex flex-wrap gap-1'>
                        {factsFor(a).map((f) => (
                          <span key={f} className='rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800'>
                            {f}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className='mt-1.5 flex items-center text-sm font-extrabold text-emerald-700'>
                      <IndianRupee className='h-3.5 w-3.5' />
                      {Number(a.price || 0).toLocaleString('en-IN')}
                    </span>
                    {placeFor(a) && (
                      <span className='mt-1 flex items-center gap-1 text-[11px] text-gray-400'>
                        <MapPin className='h-3 w-3 shrink-0' />
                        <span className='line-clamp-1'>{placeFor(a)}</span>
                      </span>
                    )}
                  </div>
                </button>
              ) : (
                /* Fallback: animal type cards while listings load / when empty */
                <button
                  key={`${a.key}-${idx}`}
                  onClick={() => onSelect?.(a)}
                  className='group flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg md:w-52'
                >
                  <div className='relative h-32 w-full overflow-hidden bg-gray-100 md:h-36'>
                    <Image
                      src={a.img}
                      alt={a.en}
                      fill
                      className='object-cover transition duration-300 group-hover:scale-105'
                      sizes='(max-width:768px) 44vw, 208px'
                      unoptimized
                    />
                  </div>
                  <div className='flex items-center justify-between px-3 py-3'>
                    <span className='text-sm font-bold text-gray-900 md:text-base'>
                      {lang === 'hi' ? a.hi : a.en}
                    </span>
                    <ArrowRight className='h-4 w-4 text-emerald-600 transition group-hover:translate-x-0.5' />
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Sell CTA + view-all */}
        <div className='mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-700 to-green-600 px-6 py-6 text-white md:flex-row md:px-10'>
          <div className='flex items-center gap-4'>
            <span className='rounded-2xl bg-white/15 p-3 backdrop-blur'>
              <Tag className='h-7 w-7' />
            </span>
            <div>
              <h3 className='text-lg font-extrabold md:text-xl'>{t.sell}</h3>
              <p className='text-sm text-emerald-100'>{t.sellDesc}</p>
            </div>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={() => onSelect?.({ q: '', en: 'All Animals', hi: 'सभी पशु' })}
              className='rounded-full border border-white/60 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/10'
            >
              {t.viewAll}
            </button>
            <button
              onClick={() => onSell?.()}
              className='rounded-full bg-white px-5 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50'
            >
              {t.sell} →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
