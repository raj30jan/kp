'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import { LangProvider } from '../../lib/lang-context'
import { isPublicPath } from '../../lib/auth-guard'

function AuthGuard({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token && !isPublicPath(pathname)) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    setChecked(true)
  }, [pathname, router])

  if (!checked && !isPublicPath(pathname)) {
    return <div className='min-h-[60vh] w-full' />
  }

  return children
}

export default function AppShell({ children }) {
  const [lang, setLang] = useState('en')

  return (
    <div className='flex min-h-screen w-full flex-col'>
      <Navbar lang={lang} setLang={setLang} />
      <LangProvider value={{ lang, setLang }}>
        <main className='w-full flex-1'>
          <AuthGuard>{children}</AuthGuard>
        </main>
      </LangProvider>
      <Footer lang={lang} />
    </div>
  )
}
