'use client'

import { useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

export default function AppShell({ children }) {
  const [lang, setLang] = useState('en')

  return (
    <div className='flex min-h-screen flex-col'>
      <Navbar lang={lang} setLang={setLang} />
      <div className='flex flex-1'>{children}</div>
      <Footer lang={lang} />
    </div>
  )
}
