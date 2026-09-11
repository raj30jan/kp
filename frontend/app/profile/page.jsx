'use client'

import { useState } from 'react'
import { User, Phone, Mail, MapPin, Lock, Camera, Edit, Save, Calendar, Award } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: 'Rajinder Kumar',
    mobile: '9876543210',
    email: 'rajinder@example.com',
    state: 'Punjab',
    district: 'Ludhiana',
    city: 'Ludhiana',
    memberSince: '2024',
    membership: 'Gold',
  })

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <Sidebar />
      <div className='flex-1 min-w-0 flex flex-col'>
        <Header />
        <main className='flex-1 p-4 md:p-6'>
          <div className='mx-auto max-w-3xl space-y-6'>
            {/* Profile header */}
            <div className='rounded-2xl bg-gradient-to-r from-emerald-700 to-green-600 p-6 text-white shadow-sm'>
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  <div className='flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur'>
                    <User className='h-10 w-10' />
                  </div>
                  <button className='absolute bottom-0 right-0 rounded-full bg-white p-1.5 text-emerald-700 shadow'>
                    <Camera className='h-3 w-3' />
                  </button>
                </div>
                <div>
                  <h1 className='text-2xl font-bold'>{profile.name}</h1>
                  <p className='text-sm text-emerald-100'>{profile.mobile}</p>
                  <div className='mt-2 flex items-center gap-2'>
                    <span className='inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-emerald-900'>
                      <Award className='h-3 w-3' /> {profile.membership} Member
                    </span>
                    <span className='text-xs text-emerald-100'>
                      <Calendar className='inline h-3 w-3' /> Since {profile.memberSince}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable profile info */}
            <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-lg font-bold text-gray-900'>Profile Details</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className='inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100'
                >
                  {editing ? <><Save className='h-4 w-4' /> Save</> : <><Edit className='h-4 w-4' /> Edit</>}
                </button>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Full Name</label>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' disabled={!editing} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Mobile</label>
                  <div className='relative'>
                    <Phone className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='tel' disabled={!editing} value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Email</label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='email' disabled={!editing} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>State</label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' disabled={!editing} value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>District</label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' disabled={!editing} value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>City</label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' disabled={!editing} value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Change password */}
            <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
              <h2 className='mb-4 text-lg font-bold text-gray-900'>Change Password</h2>
              <div className='space-y-4'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>Current Password</label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='password' className={inputClass} placeholder='******' />
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>New Password</label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                      <input type='password' className={inputClass} placeholder='******' />
                    </div>
                  </div>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>Confirm Password</label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                      <input type='password' className={inputClass} placeholder='******' />
                    </div>
                  </div>
                </div>
                <button className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'>
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
