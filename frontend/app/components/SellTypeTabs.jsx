'use client'

import { Carrot, Apple, Wheat, Milk, PawPrint, Trees, Tractor, Briefcase } from 'lucide-react'

// "What are you listing?" switcher shown at the top of every listing form.
// Product families set the category on the common Sell form; animals and
// jobs/services have their own dedicated forms and simply route there.
export const SELL_TABS = [
  { key: 'vegetables', icon: Carrot, en: 'Vegetables', hi: 'सब्जियाँ', category: 'vegetables' },
  { key: 'fruits', icon: Apple, en: 'Fruits', hi: 'फल', category: 'fruits' },
  { key: 'grains', icon: Wheat, en: 'Grains & Pulses', hi: 'अनाज व दालें', category: 'grains-cereals' },
  { key: 'dairy', icon: Milk, en: 'Milk Products', hi: 'डेयरी', category: 'dairy' },
  { key: 'land', icon: Trees, en: 'Agriculture Land', hi: 'कृषि भूमि', category: 'land' },
  { key: 'machines', icon: Tractor, en: 'Machines & Vehicles', hi: 'मशीन व वाहन', category: 'agri-machinery' },
  { key: 'animals', icon: PawPrint, en: 'Animals', hi: 'पशु', href: '/sell-animal' },
  { key: 'services', icon: Briefcase, en: 'Jobs & Services', hi: 'नौकरी व सेवाएँ', href: '/services/new' },
]

/**
 * @param active   key of the highlighted tab
 * @param onPick   (tab) => void — parent decides: set category or router.push(tab.href)
 * @param vertical render as a left sidebar (md+) instead of a top strip
 */
export default function SellTypeTabs({ lang = 'hi', active, onPick, vertical = false }) {
  const hi = lang === 'hi'
  return (
    <nav
      aria-label={hi ? 'क्या बेच रहे हैं' : 'What are you listing'}
      className={
        vertical
          ? 'flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0'
          : 'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      }
    >
      {SELL_TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type='button'
            onClick={() => onPick(tab)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
              vertical ? 'md:w-full md:justify-start md:px-4 md:py-3' : ''
            } ${
              isActive
                ? 'border-emerald-600 bg-emerald-600 text-white shadow'
                : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <Icon className='h-4 w-4 shrink-0' />
            {hi ? tab.hi : tab.en}
          </button>
        )
      })}
    </nav>
  )
}

/** Which tab matches a product category slug (for highlighting). */
export function tabForCategory(slug = '') {
  const hit = SELL_TABS.find((t) => t.category && (slug === t.category || slug.startsWith(`${t.category}-`)))
  if (hit) return hit.key
  if (slug === 'pulses' || slug.startsWith('pulses-') || slug === 'rice' || slug.startsWith('rice-')) return 'grains'
  if (['tractors', 'irrigation', 'solar'].some((m) => slug === m || slug.startsWith(`${m}-`))) return 'machines'
  return ''
}
