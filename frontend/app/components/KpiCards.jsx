'use client'

import { useEffect, useState } from 'react'
import { Package, TrendingUp, Heart, ShoppingCart, Eye, Award } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

const t = {
  en: {
    activeListings: 'Active Listings', totalSub: 'total',
    totalViews: 'Total Views', viewsSub: 'across your listings',
    wishlist: 'Wishlist', wishlistSub: 'saved for later',
    bucket: 'Buying Bucket', bucketSub: 'items to purchase',
    membership: 'Membership', paid: 'Paid', free: 'Free', unlimited: 'unlimited', freeLeft: 'free listings left',
    salesTrend: 'Sales Trend', comingSoon: 'coming soon',
  },
  hi: {
    activeListings: 'सक्रिय लिस्टिंग', totalSub: 'कुल',
    totalViews: 'कुल व्यू', viewsSub: 'आपकी लिस्टिंग पर',
    wishlist: 'विशलिस्ट', wishlistSub: 'बाद के लिए सहेजी गई',
    bucket: 'खरीद बकेट', bucketSub: 'खरीदने वाली वस्तुएँ',
    membership: 'मेंबरशिप', paid: 'पेड', free: 'फ्री', unlimited: 'असीमित', freeLeft: 'फ्री लिस्टिंग शेष',
    salesTrend: 'बिक्री रुझान', comingSoon: 'जल्द आ रहा है',
  },
}

// Real per-user KPIs — fetched from the logged-in user's own data.
export default function KpiCards() {
  const { lang } = useLang()
  const text = t[lang] || t.en
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token) { setStats({}); return }
    Promise.all([
      api.getMyProducts({ limit: 50 }, token).catch(() => ({ items: [] })),
      api.getInterests(null, token).catch(() => ({ items: [] })),
      api.getMyMembershipStatus(token).catch(() => null),
    ]).then(([productsRes, interestsRes, membership]) => {
      const products = productsRes?.items || []
      const interests = interestsRes?.items || []
      setStats({
        activeListings: products.filter((p) => p.status === 'active').length,
        totalProducts: products.length,
        totalViews: products.reduce((a, b) => a + (Number(b.views) || 0), 0),
        wishlist: interests.filter((i) => i.type === 'wishlist').length,
        bucket: interests.filter((i) => i.type === 'cart').length,
        isPaid: membership?.isPaid || false,
        freeListingsRemaining: membership?.freeListingsRemaining,
      })
    })
  }, [])

  const cards = [
    { label: text.activeListings, value: stats?.activeListings ?? '—', sub: `${stats?.totalProducts ?? 0} ${text.totalSub}`, icon: Package, color: 'bg-kisan-100 text-kisan-700' },
    { label: text.totalViews, value: stats?.totalViews ?? '—', sub: text.viewsSub, icon: Eye, color: 'bg-amber-100 text-amber-700' },
    { label: text.wishlist, value: stats?.wishlist ?? '—', sub: text.wishlistSub, icon: Heart, color: 'bg-rose-100 text-rose-700' },
    { label: text.bucket, value: stats?.bucket ?? '—', sub: text.bucketSub, icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-700' },
    { label: text.membership, value: stats ? (stats.isPaid ? text.paid : text.free) : '—', sub: stats?.isPaid ? text.unlimited : `${stats?.freeListingsRemaining ?? '—'} ${text.freeLeft}`, icon: Award, color: 'bg-blue-100 text-blue-700' },
    { label: text.salesTrend, value: '—', sub: text.comingSoon, icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
  ]

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className='rounded-2xl bg-white p-4 shadow-sm border border-gray-100'>
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-xs text-gray-500'>{card.label}</p>
                <p className='mt-1 text-2xl font-bold text-gray-800'>{card.value}</p>
              </div>
              <div className={`rounded-lg p-2 ${card.color}`}>
                <Icon className='h-5 w-5' />
              </div>
            </div>
            <p className='mt-2 text-xs text-gray-500'>{card.sub}</p>
          </div>
        )
      })}
    </div>
  )
}
