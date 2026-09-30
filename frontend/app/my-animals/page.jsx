'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { api, API_BASE } from '../../lib/api'
import { useLang } from '../../lib/lang-context'
import { PawPrint, MapPin, IndianRupee, Trash2, Plus, Loader2, Milk } from 'lucide-react'

// Uploads are served at the backend root (/uploads), not under /api/v1.
const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const STATUS = {
  pending: { en: 'Pending approval', hi: 'समीक्षा में', cls: 'bg-amber-100 text-amber-800' },
  active: { en: 'Live', hi: 'लाइव', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { en: 'Rejected', hi: 'अस्वीकृत', cls: 'bg-red-100 text-red-700' },
  deleted: { en: 'Deleted', hi: 'हटाया गया', cls: 'bg-gray-100 text-gray-600' },
}

export default function MyAnimalsPage() {
  const router = useRouter()
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const [token, setToken] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState('')

  useEffect(() => {
    const tk = localStorage.getItem('kp_token') || ''
    setToken(tk)
    if (!tk) {
      router.replace(`/login?next=${encodeURIComponent('/my-animals')}`)
      return
    }
    api
      .getMyAnimals(tk)
      .then((d) => setItems(Array.isArray(d) ? d : d?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [router])

  const remove = async (id) => {
    if (!confirm(isHindi ? 'क्या आप यह लिस्टिंग हटाना चाहते हैं?' : 'Delete this listing?')) return
    setRemoving(id)
    try {
      await api.deleteAnimal(id, token)
      setItems((prev) => prev.filter((x) => x.id !== id))
    } catch (e) {
      alert(e.message || 'Delete failed')
    } finally {
      setRemoving('')
    }
  }

  const thumb = (l) => {
    const u = l.images?.[0]?.thumbUrl || l.images?.[0]?.imageUrl
    return u ? `${BACKEND_URL}${u}` : null
  }

  return (
    <div className='mx-auto max-w-5xl px-4 py-8 md:px-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='rounded-2xl bg-emerald-100 p-3 text-emerald-700'>
            <PawPrint className='h-7 w-7' />
          </span>
          <h1 className='text-2xl font-extrabold text-gray-900 md:text-3xl'>
            {isHindi ? 'मेरे पशु' : 'My Animal Listings'}
          </h1>
        </div>
        <Link
          href='/sell-animal'
          className='inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
        >
          <Plus className='h-4 w-4' /> {isHindi ? 'पशु जोड़ें' : 'Add animal'}
        </Link>
      </div>

      {loading ? (
        <div className='flex justify-center py-20'>
          <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
        </div>
      ) : items.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center'>
          <PawPrint className='mx-auto h-10 w-10 text-gray-300' />
          <p className='mt-3 text-gray-600'>{isHindi ? 'अभी कोई पशु नहीं।' : 'No animals yet.'}</p>
          <Link href='/sell-animal' className='mt-4 inline-block rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'>
            {isHindi ? 'पहला पशु बेचें' : 'Sell your first animal'}
          </Link>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {items.map((l) => (
            <div key={l.id} className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
              <div className='relative h-44 w-full bg-gray-100'>
                {thumb(l) ? (
                  <Image src={thumb(l)} alt={l.title} fill className='object-cover' unoptimized />
                ) : (
                  <div className='flex h-full items-center justify-center text-gray-300'>
                    <PawPrint className='h-10 w-10' />
                  </div>
                )}
                <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS[l.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS[l.status]?.[isHindi ? 'hi' : 'en'] || l.status}
                </span>
              </div>
              <div className='p-4'>
                <h3 className='line-clamp-1 font-semibold text-gray-900'>{l.title}</h3>
                <p className='mt-0.5 text-xs text-gray-500'>
                  {(isHindi && l.type?.nameHi) || l.type?.name}
                  {l.breed ? ` • ${(isHindi && l.breed.nameHi) || l.breed.name}` : ''}
                </p>
                {l.milkCapacity && (
                  <p className='mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700'>
                    <Milk className='h-3.5 w-3.5' /> {l.milkCapacity} L/day
                    {l.lactationNumber ? ` • ${isHindi ? 'ब्यात' : 'Lactation'} ${l.lactationNumber}` : ''}
                  </p>
                )}
                {l.location && (
                  <p className='mt-1 flex items-center gap-1 text-xs text-gray-500'>
                    <MapPin className='h-3.5 w-3.5' /> {l.district || l.location}
                  </p>
                )}
                <div className='mt-3 flex items-center justify-between'>
                  <span className='inline-flex items-center gap-0.5 text-lg font-bold text-emerald-700'>
                    <IndianRupee className='h-4 w-4' />
                    {Number(l.price).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => remove(l.id)}
                    disabled={removing === l.id}
                    className='rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50'
                    aria-label='Delete'
                  >
                    {removing === l.id ? <Loader2 className='h-4 w-4 animate-spin' /> : <Trash2 className='h-4 w-4' />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
