'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Heart, ShoppingCart, MapPin, Trash2, Loader2, Package } from 'lucide-react'
import { api, API_BASE, notifyInterestsChanged } from '../../lib/api'
import { useLang } from '../../lib/lang-context'
import { displayTitle, landRatePerAcre, unitLabel } from '../../lib/product-utils'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const t = {
  en: {
    title: 'My Interests',
    subtitle: 'Products you saved — pick up where you left off.',
    wishlist: 'Wishlist',
    bucket: 'Buying Bucket',
    emptyWishlist: 'Nothing saved yet. Tap the heart on any product to keep it here.',
    emptyBucket: 'Your bucket is empty. Add products you plan to buy.',
    browse: 'Browse Marketplace',
    remove: 'Remove',
    view: 'View',
    perAcre: '/acre',
  },
  hi: {
    title: 'मेरी रुचियाँ',
    subtitle: 'आपके सहेजे गए उत्पाद — जहाँ छोड़ा था वहीं से जारी रखें।',
    wishlist: 'विशलिस्ट',
    bucket: 'खरीद बकेट',
    emptyWishlist: 'अभी कुछ सहेजा नहीं गया। किसी उत्पाद पर दिल का निशान दबाएँ।',
    emptyBucket: 'आपकी बकेट खाली है। खरीदने योग्य उत्पाद जोड़ें।',
    browse: 'मार्केटप्लेस देखें',
    remove: 'हटाएँ',
    view: 'देखें',
    perAcre: '/एकड़',
  },
}

function productImage(p) {
  if (!p?.imageUrls) return null
  const imgs = Array.isArray(p.imageUrls) ? p.imageUrls : [p.imageUrls]
  const first = imgs[0]
  if (!first) return null
  if (typeof first === 'string') return BACKEND_URL + first
  if (first.thumb) return BACKEND_URL + first.thumb
  if (first.url) return BACKEND_URL + first.url
  return null
}

function priceText(p, lang, text) {
  const rate = landRatePerAcre(p)
  if (rate != null) return `₹${rate.toLocaleString('en-IN')}${text.perAcre}`
  const unit = unitLabel(p.priceUnit, lang)
  return `₹${Number(p.price).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`
}

function MyInterestsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLang()
  const text = t[lang] || t.en
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState('')

  // The active tab lives in the URL (?tab=wishlist|cart) so the header's
  // wishlist and bucket icons each open their own list every time — even
  // when already on this page (the component stays mounted across
  // query-only navigations, so local state alone would go stale).
  const tab = searchParams.get('tab') === 'cart' ? 'cart' : 'wishlist'
  const setTab = (next) => router.replace(`/my-interests?tab=${next}`)

  useEffect(() => {
    const token = localStorage.getItem('kp_token')
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/my-interests?tab=${tab}`)}`)
      return
    }
    api.getInterests(null, token)
      .then((res) => setItems(res?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [router])

  const remove = async (item) => {
    const token = localStorage.getItem('kp_token')
    if (!token) return
    setRemoving(item.id)
    try {
      await api.removeInterest(item.product.id, item.type, token)
      setItems((list) => list.filter((i) => i.id !== item.id))
      notifyInterestsChanged()
    } catch {}
    finally { setRemoving('') }
  }

  const wishlistItems = items.filter((i) => i.type === 'wishlist')
  const cartItems = items.filter((i) => i.type === 'cart')
  const shown = tab === 'wishlist' ? wishlistItems : cartItems
  const emptyMsg = tab === 'wishlist' ? text.emptyWishlist : text.emptyBucket

  if (loading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='mx-auto max-w-7xl px-4 py-8 md:px-6'>
        <h1 className='text-2xl font-bold text-gray-900 md:text-3xl'>{text.title}</h1>
        <p className='mt-1 text-sm text-gray-500'>{text.subtitle}</p>

        {/* Tabs */}
        <div className='mt-6 flex gap-2'>
          <button
            onClick={() => setTab('wishlist')}
            type='button'
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === 'wishlist' ? 'bg-rose-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-rose-600'
            }`}
          >
            <Heart className={`h-4 w-4 ${tab === 'wishlist' ? 'fill-white' : ''}`} />
            {text.wishlist}
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === 'wishlist' ? 'bg-white/20' : 'bg-gray-100'}`}>
              {wishlistItems.length}
            </span>
          </button>
          <button
            onClick={() => setTab('cart')}
            type='button'
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === 'cart' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-emerald-600'
            }`}
          >
            <ShoppingCart className={`h-4 w-4 ${tab === 'cart' ? 'fill-white' : ''}`} />
            {text.bucket}
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === 'cart' ? 'bg-white/20' : 'bg-gray-100'}`}>
              {cartItems.length}
            </span>
          </button>
        </div>

        {/* Items */}
        {shown.length === 0 ? (
          <div className='mt-10 flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100'>
            <Package className='h-12 w-12 text-gray-300' />
            <p className='mt-4 max-w-sm text-sm text-gray-500'>{emptyMsg}</p>
            <Link
              href='/marketplace'
              className='mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
            >
              {text.browse}
            </Link>
          </div>
        ) : (
          <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {shown.map((item) => {
              const p = item.product
              const img = productImage(p)
              return (
                <div key={item.id} className='group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md'>
                  <Link href={`/marketplace/${p.id}`} className='relative block h-40 w-full overflow-hidden bg-gray-100'>
                    {img ? (
                      <Image src={img} alt={p.title} fill unoptimized className='object-cover transition group-hover:scale-105' sizes='300px' />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-gray-300'>
                        <Package className='h-10 w-10' />
                      </div>
                    )}
                  </Link>
                  <div className='flex flex-1 flex-col gap-1 p-4'>
                    <Link href={`/marketplace/${p.id}`} className='truncate text-sm font-semibold text-gray-900 hover:text-emerald-700'>
                      {displayTitle(p, lang)}
                    </Link>
                    <div className='flex items-center justify-between'>
                      <span className='text-base font-bold text-emerald-700'>{priceText(p, lang, text)}</span>
                      {(p.district || p.state) && (
                        <span className='flex items-center gap-1 text-xs text-gray-500'>
                          <MapPin className='h-3 w-3' />
                          {[p.district, p.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className='mt-3 flex gap-2'>
                      <Link
                        href={`/marketplace/${p.id}`}
                        className='flex flex-1 items-center justify-center rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700'
                      >
                        {text.view}
                      </Link>
                      <button
                        onClick={() => remove(item)}
                        disabled={removing === item.id}
                        className='flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50'
                      >
                        {removing === item.id ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Trash2 className='h-3.5 w-3.5' />}
                        {text.remove}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyInterestsPage() {
  return (
    <Suspense fallback={
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
      </div>
    }>
      <MyInterestsContent />
    </Suspense>
  )
}
