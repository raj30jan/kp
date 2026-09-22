'use client'

import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

const t = {
  en: {
    title: 'My Listing Pipeline',
    stages: { pending: 'Pending', active: 'Active', expired: 'Expired', rejected: 'Rejected' },
    listings: 'Listings', views: 'Views', liveNow: 'Live Now',
  },
  hi: {
    title: 'मेरी लिस्टिंग पाइपलाइन',
    stages: { pending: 'लंबित', active: 'सक्रिय', expired: 'समाप्त', rejected: 'अस्वीकृत' },
    listings: 'लिस्टिंग', views: 'व्यू', liveNow: 'अभी लाइव',
  },
}

// Real per-user listing pipeline — counts of the logged-in user's products
// grouped by status, plus aggregate engagement (views / interested / contacts).
export default function ProductLifecycle() {
  const { lang } = useLang()
  const text = t[lang] || t.en
  const [data, setData] = useState(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token) { setData({}); return }
    api.getMyProducts({ limit: 50 }, token)
      .then((res) => {
        const items = res?.items || []
        const byStatus = {}
        let views = 0
        for (const p of items) {
          byStatus[p.status] = (byStatus[p.status] || 0) + 1
          views += Number(p.views) || 0
        }
        setData({ byStatus, views, total: items.length })
      })
      .catch(() => setData({}))
  }, [])

  const stages = ['pending', 'active', 'expired', 'rejected']
  const byStatus = data?.byStatus || {}

  return (
    <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100'>
      <h3 className='mb-4 text-sm font-semibold text-gray-700'>{text.title}</h3>
      <div className='flex flex-wrap gap-2'>
        {stages.map((s) => (
          <div key={s} className='flex flex-col items-center rounded-xl bg-gray-50 px-4 py-3'>
            <span className='text-xl font-bold text-kisan-700'>{byStatus[s] || 0}</span>
            <span className='text-xs text-gray-500'>{text.stages[s]}</span>
          </div>
        ))}
      </div>
      <div className='mt-5 grid grid-cols-3 gap-3 text-center'>
        <div className='rounded-xl bg-gray-50 p-3'>
          <p className='text-lg font-bold text-kisan-700'>{data?.total ?? '—'}</p>
          <p className='text-xs text-gray-500'>{text.listings}</p>
        </div>
        <div className='rounded-xl bg-gray-50 p-3'>
          <p className='text-lg font-bold text-kisan-700'>{data?.views ?? '—'}</p>
          <p className='text-xs text-gray-500'>{text.views}</p>
        </div>
        <div className='rounded-xl bg-gray-50 p-3'>
          <p className='text-lg font-bold text-kisan-700'>{byStatus.active || 0}</p>
          <p className='text-xs text-gray-500'>{text.liveNow}</p>
        </div>
      </div>
    </div>
  )
}
