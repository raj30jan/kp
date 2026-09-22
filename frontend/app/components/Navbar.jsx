'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, LayoutDashboard, Tag, CreditCard, Menu, X, Heart, ShoppingCart, ChevronDown, User, Package, Sprout } from 'lucide-react'
import { api, AUTH_CHANGED_EVENT, INTERESTS_CHANGED_EVENT, notifyAuthChanged } from '../../lib/api'

const t = {
  en: {
    marketplace: 'Marketplace',
    mandi: 'Mandi Rates',
    weather: 'Weather',
    schemes: 'Schemes',
    services: 'Services',
    downloads: 'Downloads',
    complaints: 'Complaints',
    dashboard: 'Dashboard',
    sell: 'Sell',
    membership: 'Membership',
    interests: 'My Interests',
    wishlist: 'Wishlist',
    bucket: 'Buying Bucket',
    login: 'Login / Register',
    logout: 'Logout',
    hello: 'Hello',
    account: 'Account & Lists',
    profile: 'Your Profile',
    myProducts: 'Your Products',
    myFarm: 'Your Farm',
  },
  hi: {
    marketplace: 'मार्केटप्लेस',
    mandi: 'मंडी भाव',
    weather: 'मौसम',
    schemes: 'योजनाएँ',
    services: 'सेवाएँ',
    downloads: 'डाउनलोड',
    complaints: 'शिकायतें',
    dashboard: 'डैशबोर्ड',
    sell: 'बेचें',
    membership: 'सदस्यता',
    interests: 'मेरी रुचियाँ',
    wishlist: 'विशलिस्ट',
    bucket: 'खरीद बकेट',
    login: 'लॉग इन / पंजीकरण',
    logout: 'लॉग आउट',
    hello: 'नमस्ते',
    account: 'खाता और सूचियाँ',
    profile: 'आपकी प्रोफ़ाइल',
    myProducts: 'आपके उत्पाद',
    myFarm: 'आपका खेत',
  },
}

export default function Navbar({ lang = 'en', setLang }) {
  const router = useRouter()
  const pathname = usePathname()
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [counts, setCounts] = useState({ wishlist: 0, cart: 0 })
  const accountRef = useRef(null)
  const text = t[lang]

  // Close the account dropdown on outside click / route change.
  useEffect(() => {
    const onDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])
  useEffect(() => { setAccountOpen(false) }, [pathname])

  const refreshCounts = (t) => {
    if (!t) { setCounts({ wishlist: 0, cart: 0 }); return }
    api.getInterests(null, t)
      .then((res) => {
        const items = res?.items || []
        setCounts({
          wishlist: items.filter((i) => i.type === 'wishlist').length,
          cart: items.filter((i) => i.type === 'cart').length,
        })
      })
      .catch(() => setCounts({ wishlist: 0, cart: 0 }))
  }

  const refreshAuth = () => {
    const t = localStorage.getItem('kp_token')
    setToken(t)
    if (t) {
      api.getMe(t)
        .then((data) => { if (data && (data.id || data.name)) setUser(data) })
        .catch(() => setUser(null))
    } else {
      setUser(null)
    }
    refreshCounts(t)
  }

  // Re-read auth + badge counts on navigation AND whenever another
  // component signals a change (add to wishlist/bucket, login, expiry).
  useEffect(() => {
    refreshAuth()
    const onInterests = () => refreshCounts(localStorage.getItem('kp_token'))
    window.addEventListener(INTERESTS_CHANGED_EVENT, onInterests)
    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuth)
    return () => {
      window.removeEventListener(INTERESTS_CHANGED_EVENT, onInterests)
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kp_token')
      localStorage.removeItem('kp_mobile')
    }
    setUser(null)
    setToken(null)
    setCounts({ wishlist: 0, cart: 0 })
    notifyAuthChanged('logout')
    router.push('/')
  }

  const navLinks = [
    { href: '/marketplace', key: 'marketplace' },
    { href: '/mandi', key: 'mandi' },
    { href: '/services', key: 'services' },
    { href: '/downloads', key: 'downloads' },
  ]

  const loggedInLinks = [
    { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
    { href: '/sell', key: 'sell', icon: Tag },
    { href: '/membership', key: 'membership', icon: CreditCard },
  ]

  // Amazon-style "Account & Lists" dropdown entries.
  const accountLinks = [
    { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
    { href: '/profile', key: 'profile', icon: User },
    { href: '/my-products', key: 'myProducts', icon: Package },
    { href: '/my-farm', key: 'myFarm', icon: Sprout },
    { href: '/my-interests?tab=wishlist', key: 'wishlist', icon: Heart },
    { href: '/my-interests?tab=cart', key: 'bucket', icon: ShoppingCart },
    { href: '/membership', key: 'membership', icon: CreditCard },
    { href: '/sell', key: 'sell', icon: Tag },
  ]

  return (
    <header className='sticky top-0 z-50 border-b bg-white/90 backdrop-blur'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6'>
        {/* Logo — identical on every page */}
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src='/logo.png'
            alt='KisanPatrika — किसान पत्रिका'
            width={200}
            height={62}
            className='h-11 w-auto md:h-12'
            priority
          />
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
          {token && (
            <div className='flex items-center gap-1'>
              <Link
                href='/my-interests?tab=wishlist'
                title={text.wishlist}
                className='relative rounded-lg p-2 text-gray-500 transition hover:bg-rose-50 hover:text-rose-600'
              >
                <Heart className='h-5 w-5' />
                {counts.wishlist > 0 && (
                  <span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white'>
                    {counts.wishlist > 99 ? '99+' : counts.wishlist}
                  </span>
                )}
              </Link>
              <Link
                href='/my-interests?tab=cart'
                title={text.bucket}
                className='relative rounded-lg p-2 text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-600'
              >
                <ShoppingCart className='h-5 w-5' />
                {counts.cart > 0 && (
                  <span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white'>
                    {counts.cart > 99 ? '99+' : counts.cart}
                  </span>
                )}
              </Link>
            </div>
          )}
          <select
            value={lang}
            onChange={(e) => setLang?.(e.target.value)}
            className='rounded-full border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-emerald-500'
          >
            <option value='en'>English</option>
            <option value='hi'>हिन्दी</option>
          </select>

          {token ? (
            <div className='relative' ref={accountRef}>
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className='flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-100'
                aria-haspopup='menu'
                aria-expanded={accountOpen}
              >
                <div className='flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700'>
                  <span className='text-sm font-bold'>
                    {(user?.name || user?.displayName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className='hidden leading-tight md:block'>
                  <p className='text-xs text-gray-500'>
                    {text.hello}, {user?.name || user?.displayName || 'User'}
                  </p>
                  <p className='flex items-center gap-0.5 text-sm font-semibold text-gray-800'>
                    {text.account}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform md:hidden ${accountOpen ? 'rotate-180' : ''}`} />
              </button>

              {accountOpen && (
                <div className='absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg'>
                  <div className='border-b px-4 py-2.5'>
                    <p className='truncate text-sm font-semibold text-gray-800'>
                      {user?.name || user?.displayName || 'User'}
                    </p>
                    <p className='truncate text-xs capitalize text-gray-500'>
                      {user?.role || 'user'}{user?.mobile ? ` · ${user.mobile}` : ''}
                    </p>
                  </div>
                  {accountLinks.map((l) => {
                    const Icon = l.icon
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setAccountOpen(false)}
                        className='flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-700'
                      >
                        <Icon className='h-4 w-4 text-gray-400' />
                        {text[l.key]}
                      </Link>
                    )
                  })}
                  <button
                    onClick={handleLogout}
                    className='flex w-full items-center gap-2.5 border-t px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50'
                  >
                    <LogOut className='h-4 w-4' />
                    {text.logout}
                  </button>
                </div>
              )}
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
