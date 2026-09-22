'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, Mail, MapPin, Lock, Camera, Edit, Save, Calendar, ShieldCheck, Loader2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useLang } from '../../lib/lang-context'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

const t = {
  en: {
    hello: 'Hello,', user: 'User', since: 'Since',
    profileDetails: 'Profile Details', edit: 'Edit', save: 'Save',
    fullName: 'Full Name', mobile: 'Mobile', email: 'Email',
    state: 'State', city: 'City', address: 'Address',
    changePassword: 'Change Password', currentPassword: 'Current Password',
    newPassword: 'New Password', confirmPassword: 'Confirm Password',
    updatePassword: 'Update Password',
  },
  hi: {
    hello: 'नमस्ते,', user: 'उपयोगकर्ता', since: 'से सदस्य',
    profileDetails: 'प्रोफ़ाइल विवरण', edit: 'संपादित करें', save: 'सहेजें',
    fullName: 'पूरा नाम', mobile: 'मोबाइल', email: 'ईमेल',
    state: 'राज्य', city: 'शहर', address: 'पता',
    changePassword: 'पासवर्ड बदलें', currentPassword: 'वर्तमान पासवर्ड',
    newPassword: 'नया पासवर्ड', confirmPassword: 'पासवर्ड की पुष्टि करें',
    updatePassword: 'पासवर्ड अपडेट करें',
  },
}

export default function ProfilePage() {
  const router = useRouter()
  const { lang } = useLang()
  const text = t[lang] || t.en
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    name: '',
    mobile: '',
    email: '',
    role: '',
    address: '',
    state: '',
    city: '',
    memberSince: '',
  })

  // Load the real logged-in user from /auth/me (JWT in localStorage).
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token) {
      router.replace('/login?next=/profile')
      return
    }
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const addr = data?.address || {}
        const addressLine = [addr.line1, addr.line2, addr.landmark].filter(Boolean).join(', ')
        setProfile({
          name: data?.name || '',
          mobile: data?.mobile || '',
          email: data?.email || '',
          role: data?.role || 'user',
          address: addressLine,
          state: addr.state || '',
          city: addr.city || '',
          memberSince: data?.memberSince ? new Date(data.memberSince).getFullYear().toString() : '',
        })
      })
      .catch(() => {
        localStorage.removeItem('kp_token')
        router.replace('/login?next=/profile')
      })
      .finally(() => setLoading(false))
  }, [router])

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-700'

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex'>
        <Sidebar />
        <div className='flex flex-1 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <Sidebar />
      <div className='flex-1 min-w-0 flex flex-col'>
        
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
                  <p className='text-sm text-emerald-100'>{text.hello}</p>
                  <h1 className='text-2xl font-bold'>{profile.name || text.user}</h1>
                  <p className='text-sm text-emerald-100'>{profile.mobile || profile.email}</p>
                  <div className='mt-2 flex items-center gap-2'>
                    <span className='inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold capitalize text-emerald-900'>
                      <ShieldCheck className='h-3 w-3' /> {profile.role}
                    </span>
                    {profile.memberSince && (
                      <span className='text-xs text-emerald-100'>
                        <Calendar className='inline h-3 w-3' /> {text.since} {profile.memberSince}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Editable profile info */}
            <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-lg font-bold text-gray-900'>{text.profileDetails}</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className='inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100'
                >
                  {editing ? <><Save className='h-4 w-4' /> {text.save}</> : <><Edit className='h-4 w-4' /> {text.edit}</>}
                </button>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{text.fullName}</label>
                  <div className='relative'>
                    <User className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' disabled={!editing} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{text.mobile}</label>
                  <div className='relative'>
                    <Phone className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='tel' disabled={!editing} value={profile.mobile} onChange={(e) => setProfile({ ...profile, mobile: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{text.email}</label>
                  <div className='relative'>
                    <Mail className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='email' disabled={!editing} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{text.state}</label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' disabled={!editing} value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{text.city}</label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' disabled={!editing} value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className='sm:col-span-2'>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{text.address}</label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='text' disabled={!editing} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Change password */}
            <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
              <h2 className='mb-4 text-lg font-bold text-gray-900'>{text.changePassword}</h2>
              <div className='space-y-4'>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>{text.currentPassword}</label>
                  <div className='relative'>
                    <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                    <input type='password' className={inputClass} placeholder='******' />
                  </div>
                </div>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>{text.newPassword}</label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                      <input type='password' className={inputClass} placeholder='******' />
                    </div>
                  </div>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>{text.confirmPassword}</label>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                      <input type='password' className={inputClass} placeholder='******' />
                    </div>
                  </div>
                </div>
                <button className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'>
                  {text.updatePassword}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
