'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package, Plus, Edit, Trash2, TrendingUp, Eye, Loader2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { api, API_BASE } from '../../lib/api'
import { displayTitle, landRatePerAcre, unitLabel } from '../../lib/product-utils'
import { useLang } from '../../lib/lang-context'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

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

function priceText(p, lang) {
  const rate = landRatePerAcre(p)
  if (rate != null) return `₹${rate.toLocaleString('en-IN')}/acre`
  const unit = unitLabel(p.priceUnit, lang)
  return `₹${Number(p.price).toLocaleString('en-IN')}${unit ? ` ${unit}` : ''}`
}

const STATUS_STYLE = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  expired: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-50 text-red-600',
  deleted: 'bg-red-50 text-red-600',
}

export default function MyProductsPage() {
  const router = useRouter()
  const { lang } = useLang()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  const token = () => (typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null)

  const load = () => {
    const t = token()
    if (!t) {
      router.replace('/login?next=/my-products')
      return
    }
    setLoading(true)
    api.getMyProducts({ limit: 50 }, t)
      .then((res) => setProducts(res?.items || []))
      .catch(() => setError('Could not load your products'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [router])

  const remove = async (p) => {
    const t = token()
    if (!t) return
    setDeleting(p.id)
    try {
      await api.deleteProduct(p.id, t)
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, status: 'deleted' } : x)))
    } catch {} finally { setDeleting('') }
  }

  const active = products.filter((p) => p.status === 'active').length
  const totalViews = products.reduce((a, b) => a + (Number(b.views) || 0), 0)
  const soldOut = products.filter((p) => p.status === 'expired' || p.status === 'deleted').length

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <Sidebar />
      <div className='flex-1 min-w-0 flex flex-col'>
        <main className='flex-1 p-4 md:p-6'>
          <div className='mx-auto max-w-5xl space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>My Products</h1>
                <p className='text-sm text-gray-500'>Manage your product listings</p>
              </div>
              <Link href='/sell' className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700'>
                <Plus className='h-4 w-4' /> Add Product
              </Link>
            </div>

            {error && <div className='rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700'>{error}</div>}

            {/* Stats */}
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Package className='h-6 w-6 text-emerald-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{products.length}</p>
                <p className='text-xs text-gray-500'>Total Products</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <TrendingUp className='h-6 w-6 text-blue-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{active}</p>
                <p className='text-xs text-gray-500'>Active Listings</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Eye className='h-6 w-6 text-amber-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{totalViews}</p>
                <p className='text-xs text-gray-500'>Total Views</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Package className='h-6 w-6 text-red-500' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{soldOut}</p>
                <p className='text-xs text-gray-500'>Sold / Expired</p>
              </div>
            </div>

            {/* Product list */}
            {loading ? (
              <div className='flex items-center justify-center py-16'><Loader2 className='h-8 w-8 animate-spin text-emerald-600' /></div>
            ) : products.length === 0 ? (
              <div className='flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100'>
                <Package className='h-12 w-12 text-gray-300' />
                <p className='mt-4 max-w-sm text-sm text-gray-500'>You haven't listed any products yet. Post your first listing to reach buyers.</p>
                <Link href='/sell' className='mt-5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'>Sell a Product</Link>
              </div>
            ) : (
              <div className='space-y-3'>
                {products.map((p) => {
                  const img = productImage(p)
                  return (
                    <div key={p.id} className='flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                      <div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100'>
                        {img ? (
                          <Image src={img} alt={p.title} fill className='object-cover' sizes='64px' unoptimized />
                        ) : (
                          <div className='flex h-full w-full items-center justify-center text-gray-300'><Package className='h-6 w-6' /></div>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='truncate text-sm font-bold text-gray-900'>{displayTitle(p, lang)}</h3>
                        <p className='text-sm font-semibold text-emerald-700'>{priceText(p, lang)}</p>
                        <p className='text-xs text-gray-500'>
                          {p.quantity ? `Qty: ${p.quantity} ${p.quantityUnit || ''} · ` : ''}{p.views || 0} views
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                      <div className='flex gap-2'>
                        <Link href={`/marketplace/${p.id}`} className='rounded-lg bg-gray-50 p-2 text-gray-600 hover:bg-gray-100' title='View'>
                          <Eye className='h-4 w-4' />
                        </Link>
                        {p.status !== 'deleted' && (
                          <button onClick={() => remove(p)} disabled={deleting === p.id} className='rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50' title='Remove listing (mark inactive)'>
                            {deleting === p.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
