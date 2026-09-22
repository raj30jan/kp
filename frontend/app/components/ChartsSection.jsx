'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { api } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

const COLORS = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#14b8a6', '#eab308']

const t = {
  en: {
    activity: 'My Listing Activity (6 months)',
    byCategory: 'My Listings by Category',
    status: 'Listing Status',
    viewsPer: 'Views per Listing',
    listingsPosted: 'Listings Posted',
    views: 'Views',
    empty: 'No listings yet — post a product to see stats here.',
    stages: { active: 'Active', pending: 'Pending', expired: 'Expired', rejected: 'Rejected' },
  },
  hi: {
    activity: 'मेरी लिस्टिंग गतिविधि (6 महीने)',
    byCategory: 'श्रेणी के अनुसार मेरी लिस्टिंग',
    status: 'लिस्टिंग स्थिति',
    viewsPer: 'प्रति लिस्टिंग व्यू',
    listingsPosted: 'पोस्ट की गई लिस्टिंग',
    views: 'व्यू',
    empty: 'अभी कोई लिस्टिंग नहीं — आँकड़े देखने के लिए उत्पाद पोस्ट करें।',
    stages: { active: 'सक्रिय', pending: 'लंबित', expired: 'समाप्त', rejected: 'अस्वीकृत' },
  },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const prettyCategory = (c) =>
  (c || 'other').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// Real per-user charts — built from the logged-in user's own listings.
export default function ChartsSection() {
  const { lang } = useLang()
  const text = t[lang] || t.en
  const [products, setProducts] = useState(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token) { setProducts([]); return }
    api.getMyProducts({ limit: 50 }, token)
      .then((res) => setProducts(res?.items || []))
      .catch(() => setProducts([]))
  }, [])

  const items = products || []

  // Listings created per month (last 6 months)
  const now = new Date()
  const monthly = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthly.push({ month: MONTHS[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth()}`, listings: 0, views: 0 })
  }
  const monthIndex = Object.fromEntries(monthly.map((m, i) => [m.key, i]))
  for (const p of items) {
    const d = new Date(p.createdAt)
    const idx = monthIndex[`${d.getFullYear()}-${d.getMonth()}`]
    if (idx != null) {
      monthly[idx].listings += 1
      monthly[idx].views += Number(p.views) || 0
    }
  }

  // Listings by category
  const catMap = {}
  for (const p of items) {
    const base = (p.category || 'other').split('-')[0]
    catMap[base] = (catMap[base] || 0) + 1
  }
  const categoryData = Object.entries(catMap)
    .map(([name, value]) => ({ name: prettyCategory(name), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Listings by status
  const statusMap = {}
  for (const p of items) statusMap[p.status] = (statusMap[p.status] || 0) + 1
  const statusData = ['active', 'pending', 'expired', 'rejected']
    .map((s) => ({ stage: text.stages[s] || s, count: statusMap[s] || 0 }))

  // Views per listing (top 8)
  const viewsData = items
    .map((p) => ({ name: (p.title || '').slice(0, 14), views: Number(p.views) || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)

  const empty = products !== null && items.length === 0
  const emptyMsg = (
    <div className='flex h-64 items-center justify-center text-sm text-gray-400'>
      {text.empty}
    </div>
  )

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100 lg:col-span-2'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>{text.activity}</h3>
        <div className='h-64 w-full'>
          {empty ? emptyMsg : (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='month' />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type='monotone' dataKey='listings' name={text.listingsPosted} stroke='#16a34a' strokeWidth={2} dot={false} />
                <Line type='monotone' dataKey='views' name={text.views} stroke='#3b82f6' strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>{text.byCategory}</h3>
        <div className='h-64 w-full'>
          {empty ? emptyMsg : (
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie data={categoryData} cx='50%' cy='50%' innerRadius={55} outerRadius={85} paddingAngle={4} dataKey='value'>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign='bottom' height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>{text.status}</h3>
        <div className='h-64 w-full'>
          {empty ? emptyMsg : (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='stage' />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey='count' fill='#16a34a' radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100 lg:col-span-2'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>{text.viewsPer}</h3>
        <div className='h-64 w-full'>
          {empty ? emptyMsg : (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={viewsData}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} />
                <XAxis dataKey='name' />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey='views' name={text.views} fill='#3b82f6' radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
