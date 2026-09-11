'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Package, Plus, Edit, Trash2, TrendingUp, Eye } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function MyProductsPage() {
  const [products] = useState([
    { id: 1, title: 'Organic Wheat (HD-2967)', price: '₹2,200/quintal', qty: '50 quintal', status: 'Active', views: 124, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400' },
    { id: 2, title: 'Basmati Rice (Pusa 1121)', price: '₹3,800/quintal', qty: '30 quintal', status: 'Active', views: 89, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
    { id: 3, title: 'Mustard Seeds (Pusa Bold)', price: '₹5,200/quintal', qty: '15 quintal', status: 'Sold Out', views: 210, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' },
    { id: 4, title: 'Fresh Tomatoes (Hybrid)', price: '₹25/kg', qty: '500 kg', status: 'Active', views: 56, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400' },
  ])

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <Sidebar />
      <div className='flex-1 min-w-0 flex flex-col'>
        <Header />
        <main className='flex-1 p-4 md:p-6'>
          <div className='mx-auto max-w-5xl space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>My Products</h1>
                <p className='text-sm text-gray-500'>Manage your product listings</p>
              </div>
              <button className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700'>
                <Plus className='h-4 w-4' /> Add Product
              </button>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Package className='h-6 w-6 text-emerald-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{products.length}</p>
                <p className='text-xs text-gray-500'>Total Products</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <TrendingUp className='h-6 w-6 text-blue-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{products.filter(p => p.status === 'Active').length}</p>
                <p className='text-xs text-gray-500'>Active Listings</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Eye className='h-6 w-6 text-amber-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{products.reduce((a, b) => a + b.views, 0)}</p>
                <p className='text-xs text-gray-500'>Total Views</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Package className='h-6 w-6 text-red-500' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{products.filter(p => p.status === 'Sold Out').length}</p>
                <p className='text-xs text-gray-500'>Sold Out</p>
              </div>
            </div>

            {/* Product list */}
            <div className='space-y-3'>
              {products.map((p) => (
                <div key={p.id} className='flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                  <div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100'>
                    <Image src={p.image} alt={p.title} fill className='object-cover' sizes='64px' unoptimized />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3 className='truncate text-sm font-bold text-gray-900'>{p.title}</h3>
                    <p className='text-sm font-semibold text-emerald-700'>{p.price}</p>
                    <p className='text-xs text-gray-500'>Qty: {p.qty} · {p.views} views</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {p.status}
                  </span>
                  <div className='flex gap-2'>
                    <Link href={`/marketplace/${p.id}`} className='rounded-lg bg-gray-50 p-2 text-gray-600 hover:bg-gray-100'>
                      <Eye className='h-4 w-4' />
                    </Link>
                    <button className='rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100'>
                      <Edit className='h-4 w-4' />
                    </button>
                    <button className='rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100'>
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
