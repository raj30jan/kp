'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MAIN_CATEGORIES } from '../../lib/main-categories'

// Patanjali-style category strip — a horizontally scrollable row of the main
// categories with an icon tile, name, and a subcategory hint. Clicking a tile
// routes to that marketplace section (or the jobs page for Jobs).
export default function CategoryNav({ lang = 'hi', onSelect }) {
  const scrollRef = useRef(null)

  const scrollBy = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <section className='border-b border-gray-100 bg-white py-5'>
      <div className='relative mx-auto max-w-7xl px-4 md:px-6'>
        {/* Left/right scroll arrows — desktop only, mobile swipes natively. */}
        <button
          onClick={() => scrollBy(-1)}
          className='absolute -left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md ring-1 ring-gray-200 transition hover:bg-emerald-50 md:block'
          aria-label='Scroll left'
        >
          <ChevronLeft className='h-5 w-5 text-gray-600' />
        </button>
        <button
          onClick={() => scrollBy(1)}
          className='absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md ring-1 ring-gray-200 transition hover:bg-emerald-50 md:block'
          aria-label='Scroll right'
        >
          <ChevronRight className='h-5 w-5 text-gray-600' />
        </button>

        <div
          ref={scrollRef}
          className='flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        >
          {MAIN_CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const label = lang === 'hi' && cat.hi ? cat.hi : cat.en
            return (
              <button
                key={cat.key}
                onClick={() => onSelect?.(cat)}
                className='group flex w-32 shrink-0 flex-col items-center rounded-2xl border border-gray-100 bg-gradient-to-b from-emerald-50/60 to-white px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md'
              >
                <span className='flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition group-hover:scale-105 group-hover:bg-emerald-700'>
                  <Icon className='h-7 w-7' />
                </span>
                <span className='mt-3 text-sm font-bold leading-tight text-gray-900'>
                  {label}
                </span>
                <span className='mt-1 line-clamp-1 text-[11px] text-gray-400'>
                  {cat.subs?.slice(0, 3).join(' · ')}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
