'use client'

import { LayoutGrid } from 'lucide-react'
import { SERVICE_TYPE_META as TYPE_META } from '../../lib/service-types'
import { useLang } from '../../lib/lang-context'

/**
 * Left professions panel — shared by the services listing and detail pages.
 * `activeType` highlights the current profession; `onSelect(type)` is called
 * with '' for "All Services" or a service-type key.
 */
export default function ServiceSidebar({ activeType = '', onSelect }) {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  // Professions sorted A→Z by the label the user actually sees.
  const sortedTypes = Object.entries(TYPE_META).sort(([, a], [, b]) =>
    (isHindi ? a.hi : a.en).localeCompare(isHindi ? b.hi : b.en, isHindi ? 'hi' : 'en'),
  )

  return (
    <aside className='w-full shrink-0 lg:w-60'>
      <div className='rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100 lg:sticky lg:top-4'>
        <h2 className='mb-2 px-2 text-sm font-bold uppercase tracking-wide text-gray-400'>
          {isHindi ? 'पेशे' : 'Professions'}
        </h2>
        <nav className='flex gap-1.5 overflow-x-auto pb-1 lg:max-h-[70vh] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0'>
          <button
            onClick={() => onSelect('')}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
              activeType === '' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-emerald-50'
            }`}
          >
            <LayoutGrid className='h-4 w-4 shrink-0' />
            {isHindi ? 'सभी सेवाएँ' : 'All Services'}
          </button>
          {sortedTypes.map(([key, meta]) => {
            const Icon = meta.icon
            const active = activeType === key
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  active ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-emerald-50'
                }`}
              >
                <Icon className='h-4 w-4 shrink-0' />
                <span className='whitespace-nowrap lg:whitespace-normal'>{isHindi ? meta.hi : meta.en}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
