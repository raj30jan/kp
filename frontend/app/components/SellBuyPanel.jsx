'use client'

import {
  Wheat,
  PawPrint,
  Trees,
  Tractor,
  Tag,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react'

// The two primary actions on a farmer marketplace, side by side and impossible
// to miss: SELL (green) and BUY (orange). Each panel lists the same four asset
// types — agro products, animals, agriculture land, machines — so a farmer
// always knows exactly where to tap. Machines additionally offer Rent.
const t = {
  en: {
    sell: 'SELL',
    sellSub: 'List for free — reach verified buyers across India',
    buy: 'BUY',
    buySub: 'Browse fresh listings direct from farmers & dealers',
    rent: 'Rent',
    sale: 'Sale',
    or: 'or',
  },
  hi: {
    sell: 'बेचें',
    sellSub: 'मुफ्त सूचीबद्ध करें — पूरे भारत के सत्यापित खरीदारों तक पहुँचें',
    buy: 'खरीदें',
    buySub: 'किसानों व डीलरों से सीधे ताज़ा सूचियाँ देखें',
    rent: 'किराया',
    sale: 'बिक्री',
    or: 'या',
  },
}

const ITEMS = [
  {
    key: 'products',
    icon: Wheat,
    en: 'Agro Products',
    hi: 'कृषि उत्पाद',
    enSub: 'Grains, vegetables, fruits, dairy…',
    hiSub: 'अनाज, सब्ज़ी, फल, डेयरी…',
    sell: '/sell',
    buy: '/marketplace?group=food',
  },
  {
    key: 'animals',
    icon: PawPrint,
    en: 'Animals',
    hi: 'पशु',
    enSub: 'Cow, buffalo, goat, poultry…',
    hiSub: 'गाय, भैंस, बकरी, पोल्ट्री…',
    sell: '/sell-animal',
    buy: '/marketplace?group=animals',
  },
  {
    key: 'land',
    icon: Trees,
    en: 'Agriculture Land',
    hi: 'कृषि भूमि',
    enSub: 'Farm land, plots, farmhouse',
    hiSub: 'खेत, प्लॉट, फार्महाउस',
    sell: '/sell?category=land',
    buy: '/marketplace?group=land',
  },
  {
    key: 'machines',
    icon: Tractor,
    en: 'Agri Machines',
    hi: 'कृषि मशीनें',
    enSub: 'Tractor, harvester, pump…',
    hiSub: 'ट्रैक्टर, हार्वेस्टर, पंप…',
    sell: '/sell?category=agri-machinery',
    buy: '/marketplace?category=agri-machinery',
    // Rent = a machinery service listing (hire out / hire in).
    sellRent: '/services/new?type=machinery',
    buyRent: '/services?type=machinery',
  },
]

function Panel({ mode, lang, onGo }) {
  const text = t[lang] || t.en
  const isSell = mode === 'sell'
  const Icon = isSell ? Tag : ShoppingCart
  const theme = isSell
    ? {
        bg: 'from-emerald-600 to-green-700',
        tile: 'bg-white/10 hover:bg-white text-white hover:text-emerald-800 ring-white/20',
        sub: 'text-emerald-100',
        chip: 'bg-emerald-900/30 hover:bg-white hover:text-emerald-800',
      }
    : {
        bg: 'from-amber-500 to-orange-600',
        tile: 'bg-white/10 hover:bg-white text-white hover:text-orange-700 ring-white/20',
        sub: 'text-amber-100',
        chip: 'bg-orange-900/30 hover:bg-white hover:text-orange-700',
      }

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${theme.bg} p-5 text-white shadow-xl md:p-7`}>
      <Icon className='pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-10' />
      <div className='relative'>
        <div className='flex items-center gap-3'>
          <span className='rounded-2xl bg-white/20 p-3 backdrop-blur'>
            <Icon className='h-8 w-8' />
          </span>
          <div>
            <h2 className='text-3xl font-black tracking-wide md:text-4xl'>
              {isSell ? text.sell : text.buy}
            </h2>
            <p className={`text-sm ${theme.sub}`}>{isSell ? text.sellSub : text.buySub}</p>
          </div>
        </div>

        <div className='mt-5 grid grid-cols-2 gap-3'>
          {ITEMS.map((it) => {
            const ItemIcon = it.icon
            const label = lang === 'hi' ? it.hi : it.en
            const sub = lang === 'hi' ? it.hiSub : it.enSub
            const primary = isSell ? it.sell : it.buy
            const rent = isSell ? it.sellRent : it.buyRent
            return (
              <div key={it.key} className='flex flex-col'>
                <button
                  onClick={() => onGo(primary, `${mode.toUpperCase()}_${it.key.toUpperCase()}`, `${isSell ? 'Sell' : 'Buy'} ${it.en}`)}
                  className={`group flex flex-1 flex-col items-start rounded-2xl p-4 text-left ring-1 transition ${theme.tile}`}
                >
                  <ItemIcon className='h-8 w-8' />
                  <span className='mt-3 text-base font-extrabold leading-tight md:text-lg'>{label}</span>
                  <span className='mt-0.5 text-xs opacity-80'>{sub}</span>
                  <span className='mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide opacity-90'>
                    {rent ? text.sale : isSell ? text.sell : text.buy}
                    <ArrowRight className='h-3.5 w-3.5 transition group-hover:translate-x-0.5' />
                  </span>
                </button>
                {rent && (
                  <button
                    onClick={() => onGo(rent, `${mode.toUpperCase()}_${it.key.toUpperCase()}_RENT`, `${isSell ? 'Rent out' : 'Hire'} ${it.en}`)}
                    className={`mt-2 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/20 transition ${theme.chip}`}
                  >
                    {text.or} {text.rent} →
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function SellBuyPanel({ lang = 'hi', onGo }) {
  return (
    <section className='bg-white py-8 md:py-12'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <div className='grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8'>
          <Panel mode='sell' lang={lang} onGo={onGo} />
          <Panel mode='buy' lang={lang} onGo={onGo} />
        </div>
      </div>
    </section>
  )
}
