'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, LayoutDashboard, Tag, CreditCard, Menu, X } from 'lucide-react'
import { api } from '../../lib/api'

const t = {
  en: {
    marketplace: 'Marketplace',
    mandi: 'Mandi Rates',
    weather: 'Weather',
    schemes: 'Schemes',
    complaints: 'Complaints',
    dashboard: 'Dashboard',
    sell: 'Sell',
    membership: 'Membership',
    login: 'Login / Register',
    logout: 'Logout',
  },
  hi: {
    marketplace: 'मार्केटप्लेस',
    mandi: 'मंडी भाव',
    weather: 'मौसम',
    schemes: 'योजनाएँ',
    complaints: 'शिकायतें',
    dashboard: 'डैशबोर्ड',
    sell: 'बेचें',
    membership: 'सदस्यता',
    login: 'लॉग इन / पंजीकरण',
    logout: 'लॉग आउट',
  },
}

export default function Navbar({ lang = 'en', setLang }) {
  const router = useRouter()
  const pathname = usePathname()
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const text = t[lang]

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('kp_token')
      setToken(t)
      if (t) {
        // Fetch user profile via /auth/me
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
        })
          .then((r) => r.json())
          .then((data) => { if (data?.user) setUser(data.user) })
          .catch(() => {})
      }
    }
  }, [pathname])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kp_token')
      localStorage.removeItem('kp_mobile')
    }
    setUser(null)
    setToken(null)
    router.push('/')
  }

  const navLinks = [
    { href: '/marketplace', key: 'marketplace' },
    { href: '/mandi', key: 'mandi' },
    { href: '/weather', key: 'weather' },
    { href: '/schemes', key: 'schemes' },
    { href: '/complaints', key: 'complaints' },
  ]

  const loggedInLinks = [
    { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
    { href: '/sell', key: 'sell', icon: Tag },
    { href: '/membership', key: 'membership', icon: CreditCard },
  ]

  return (
    <header className='sticky top-0 z-50 border-b bg-white/90 backdrop-blur'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6'>
        {/* Logo (image hidden on marketplace) */}
        <Link href='/' className='flex items-center gap-2'>
          {pathname === '/marketplace' ? (
            <span className='text-lg font-bold text-emerald-700'>KisanPatrika</span>
          ) : (
            <Image
              src='/logo.png'
              alt='KisanPatrika — किसान पत्रिका'
              width={200}
              height={62}
              className='h-11 w-auto md:h-12'
              priority
            />
          )}
        </Link>

        {/* Desktop nav */}
        <nav className='hidden items-center gap-4 lg:flex'>
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium hover:text-emerald-600 ${pathname === l.href ? 'text-emerald-600' : 'text-gray-600'}`}
            >
              {text[l.key]}
            </Link>
          ))}
          {token && loggedInLinks.map((l) => {
            const Icon = l.icon
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1 text-sm font-medium hover:text-emerald-600 ${pathname === l.href ? 'text-emerald-600' : 'text-gray-600'}`}
              >
                <Icon className='h-4 w-4' />
                {text[l.key]}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className='flex items-center gap-2 md:gap-3'>
          <select
            value={lang}
            onChange={(e) => setLang?.(e.target.value)}
            className='rounded-full border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-emerald-500'
          >
            <option value='en'>English</option>
            <option value='hi'>हिन्दी</option>
          </select>

          {token ? (
            <div className='flex items-center gap-2'>
              {user && (
                <div className='hidden text-right md:block'>
                  <p className='text-sm font-medium text-gray-800'>{user.name || user.displayName || 'User'}</p>
                  <p className='text-xs capitalize text-gray-500'>{user.role || 'user'}</p>
                </div>
              )}
              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700'>
                <span className='text-sm font-bold'>
                  {(user?.name || user?.displayName || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className='flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100'
              >
                <LogOut className='h-4 w-4' />
                <span className='hidden sm:inline'>{text.logout}</span>
              </button>
            </div>
          ) : (
            <Link
              href='/login'
              className='rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700'
            >
              {text.login}
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className='rounded-lg p-2 hover:bg-gray-100 lg:hidden'
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <nav className='border-t bg-white px-4 py-3 lg:hidden'>
          <div className='space-y-1'>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${pathname === l.href ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {text[l.key]}
              </Link>
            ))}
            {token && loggedInLinks.map((l) => {
              const Icon = l.icon
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${pathname === l.href ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Icon className='h-4 w-4' />
                  {text[l.key]}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
