'use client'

import { useState } from 'react'
import { Sprout, MapPin, Calendar, Droplets, Plus, Edit, Trash2, Sun } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function MyFarmPage() {
  const [farms] = useState([
    { id: 1, name: 'Farm Plot A', area: '5 acres', location: 'Ludhiana, Punjab', crop: 'Wheat (HD-2967)', sown: '15 Nov 2024', harvest: 'Apr 2025', irrigation: 'Tube well', soil: 'Loamy' },
    { id: 2, name: 'Farm Plot B', area: '3 acres', location: 'Ludhiana, Punjab', crop: 'Mustard (Pusa Bold)', sown: '20 Oct 2024', harvest: 'Mar 2025', irrigation: 'Canal', soil: 'Sandy Loam' },
    { id: 3, name: 'Kitchen Garden', area: '0.5 acres', location: 'Ludhiana, Punjab', crop: 'Vegetables (Mixed)', sown: 'Continuous', harvest: 'Year-round', irrigation: 'Drip', soil: 'Clay Loam' },
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
                <h1 className='text-2xl font-bold text-gray-900'>My Farm</h1>
                <p className='text-sm text-gray-500'>Manage your farm plots and crops</p>
              </div>
              <button className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700'>
                <Plus className='h-4 w-4' /> Add Plot
              </button>
            </div>

            {/* Farm summary */}
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Sprout className='h-6 w-6 text-emerald-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>{farms.length}</p>
                <p className='text-xs text-gray-500'>Total Plots</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <MapPin className='h-6 w-6 text-blue-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>8.5</p>
                <p className='text-xs text-gray-500'>Acres Total</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Calendar className='h-6 w-6 text-amber-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>3</p>
                <p className='text-xs text-gray-500'>Active Crops</p>
              </div>
              <div className='rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <Droplets className='h-6 w-6 text-cyan-600' />
                <p className='mt-2 text-2xl font-bold text-gray-900'>3</p>
                <p className='text-xs text-gray-500'>Water Sources</p>
              </div>
            </div>

            {/* Farm plots */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {farms.map((f) => (
                <div key={f.id} className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50'>
                        <Sprout className='h-6 w-6 text-emerald-700' />
                      </div>
                      <div>
                        <h3 className='text-lg font-bold text-gray-900'>{f.name}</h3>
                        <p className='text-sm text-gray-500'>{f.area} · {f.location}</p>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <button className='rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100'>
                        <Edit className='h-4 w-4' />
                      </button>
                      <button className='rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100'>
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </div>

                  <div className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <p className='text-xs font-medium text-gray-500'>Current Crop</p>
                      <p className='font-semibold text-gray-900'>{f.crop}</p>
                    </div>
                    <div>
                      <p className='text-xs font-medium text-gray-500'>Soil Type</p>
                      <p className='font-semibold text-gray-900'>{f.soil}</p>
                    </div>
                    <div>
                      <p className='text-xs font-medium text-gray-500'>Sown Date</p>
                      <p className='font-semibold text-gray-900'>{f.sown}</p>
                    </div>
                    <div>
                      <p className='text-xs font-medium text-gray-500'>Harvest</p>
                      <p className='font-semibold text-gray-900'>{f.harvest}</p>
                    </div>
                    <div className='col-span-2'>
                      <p className='text-xs font-medium text-gray-500'>Irrigation</p>
                      <p className='font-semibold text-gray-900'>{f.irrigation}</p>
                    </div>
                  </div>

                  <div className='mt-4 flex gap-2'>
                    <button className='flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-50 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100'>
                      <Sun className='h-3 w-3' /> Weather
                    </button>
                    <button className='flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-50 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100'>
                      <Droplets className='h-3 w-3' /> Irrigate
                    </button>
                    <button className='flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-50 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100'>
                      <Calendar className='h-3 w-3' /> Schedule
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
