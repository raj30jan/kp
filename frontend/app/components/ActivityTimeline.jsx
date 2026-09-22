'use client'

import { useEffect, useState } from 'react'
import { Activity, Package, Heart, ShoppingCart, User, LogIn, Sprout, Award, Eye } from 'lucide-react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

const ACTION_META = {
  'auth.login': { icon: LogIn, label: 'Signed in', labelHi: 'साइन इन किया' },
  'auth.register': { icon: User, label: 'Account created', labelHi: 'खाता बनाया' },
  'auth.logout': { icon: LogIn, label: 'Signed out', labelHi: 'साइन आउट किया' },
  'product.created': { icon: Package, label: 'Listed a product', labelHi: 'उत्पाद सूचीबद्ध किया' },
  'product.updated': { icon: Package, label: 'Updated a listing', labelHi: 'लिस्टिंग अपडेट की' },
  'product.deleted': { icon: Package, label: 'Removed a listing', labelHi: 'लिस्टिंग हटाई' },
  'product.viewed': { icon: Eye, label: 'Viewed a product', labelHi: 'उत्पाद देखा' },
  'interest.added': { icon: Heart, label: 'Saved to wishlist', labelHi: 'विशलिस्ट में सहेजा' },
  'interest.removed': { icon: Heart, label: 'Removed from wishlist', labelHi: 'विशलिस्ट से हटाया' },
  'cart.added': { icon: ShoppingCart, label: 'Added to buying bucket', labelHi: 'खरीद बकेट में डाला' },
  'seller.contacted': { icon: ShoppingCart, label: 'Contacted a seller', labelHi: 'विक्रेता से संपर्क किया' },
  'farm.created': { icon: Sprout, label: 'Added a farm plot', labelHi: 'फ़ार्म प्लॉट जोड़ा' },
  'farm.updated': { icon: Sprout, label: 'Updated a farm plot', labelHi: 'फ़ार्म प्लॉट अपडेट किया' },
  'farm.deleted': { icon: Sprout, label: 'Removed a farm plot', labelHi: 'फ़ार्म प्लॉट हटाया' },
  'membership.subscribed': { icon: Award, label: 'Subscribed to a plan', labelHi: 'प्लान की सदस्यता ली' },
}

function metaFor(action, isHindi) {
  const meta = ACTION_META[action]
  if (meta) return { icon: meta.icon, label: isHindi ? meta.labelHi : meta.label }
  const label = (action || 'activity').replace(/[._]/g, ' ')
  return { icon: Activity, label: label.charAt(0).toUpperCase() + label.slice(1) }
}

function timeAgo(date) {
  if (!date) return ''
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// Real per-user activity — fetched from the MongoDB activity log for the
// logged-in user. Falls back to an empty state when there's nothing yet.
export default function ActivityTimeline() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const [events, setEvents] = useState(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token) { setEvents([]); return }
    api.getMyActivity(20, token)
      .then((res) => setEvents(Array.isArray(res) ? res : res?.items || []))
      .catch(() => setEvents([]))
  }, [])

  return (
    <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100'>
      <h3 className='mb-4 text-sm font-semibold text-gray-700'>{isHindi ? 'हाल की गतिविधि' : 'Recent Activity'}</h3>
      {events === null ? (
        <p className='text-sm text-gray-400'>{isHindi ? 'लोड हो रहा है…' : 'Loading…'}</p>
      ) : events.length === 0 ? (
        <p className='text-sm text-gray-400'>{isHindi ? 'अभी कोई गतिविधि नहीं — आपकी क्रियाएँ यहाँ दिखेंगी।' : 'No activity yet — your actions will show up here.'}</p>
      ) : (
        <ol className='relative space-y-4 border-l border-gray-200 pl-4'>
          {events.map((e, i) => {
            const meta = metaFor(e.action, isHindi)
            const Icon = meta.icon
            const when = e.at || e.createdAt
            return (
              <li key={e.id || e._id || i} className='relative'>
                <span className='absolute -left-[21px] flex h-4 w-4 items-center justify-center rounded-full bg-kisan-100 ring-4 ring-white'>
                  <Icon className='h-2.5 w-2.5 text-kisan-700' />
                </span>
                <p className='text-sm font-medium text-gray-800'>{meta.label}</p>
                {e.meta?.title && <p className='text-xs text-gray-500'>{e.meta.title}</p>}
                <p className='text-xs text-gray-400'>{timeAgo(when)}</p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
