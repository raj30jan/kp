'use client'

import Image from 'next/image'
import { Package } from 'lucide-react'
import { products } from '../marketplace/products.js'

const text = {
  en: { title: 'Newly Added Products', qty: 'Qty', new: 'NEW' },
  hi: { title: 'नए जोड़े गए उत्पाद', qty: 'मात्रा', new: 'नया' },
}

// Doubling the list gives a seamless, continuous scroll loop (see .marquee-track
// keyframes in globals.css, which translates exactly -50%).
export default function FeaturedProductsMarquee({ lang = 'en', onProductClick }) {
  const t = text[lang] || text.en
  // Newly added products lead the marquee so they get noticed first
  const ordered = [...products].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
  const items = [...ordered, ...ordered]

  return (
    <section className='bg-white py-10 md:py-14'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <h2 className='mb-6 text-center text-2xl font-bold text-gray-900 md:text-3xl'>
          {t.title}
        </h2>
        <div className='overflow-hidden'>
          <div className='marquee-track flex w-max gap-4'>
            {items.map((p, idx) => (
              <button
                key={`${p.id}-${idx}`}
                onClick={() => onProductClick?.(p)}
                className='group flex w-56 shrink-0 flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg'
              >
                <div className='relative h-36 w-full overflow-hidden bg-gray-100'>
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    unoptimized
                    className='object-cover transition group-hover:scale-105'
                    sizes='224px'
                  />
                  {p.isNew && (
                    <span className='absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow'>
                      {t.new}
                    </span>
                  )}
                </div>
                <div className='flex flex-1 flex-col gap-1 p-3'>
                  <h3 className='truncate text-sm font-semibold text-gray-900'>{p.title}</h3>
                  <div className='flex items-center justify-between'>
                    <span className='text-base font-bold text-emerald-700'>{p.price}</span>
                    <span className='flex items-center gap-1 text-xs text-gray-500'>
                      <Package className='h-3 w-3' />
                      {p.quantity}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
