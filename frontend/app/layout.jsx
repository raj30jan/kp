import './globals.css'
import { cookies } from 'next/headers'
import AppShell from './components/AppShell'

export const metadata = {
  title: 'KisanPatrika — किसान पत्रिका | AI + Agro Farming Ecosystem',
  description:
    "World's #1 AI-powered agro farming web platform — Connecting Rural India with the world. Buy & sell farm products, mandi bhav, weather, govt schemes, hire machinery & more.",
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }) {
  const initialLang = cookies().get('kp_lang')?.value
  return (
    <html lang={initialLang === 'en' ? 'en' : 'hi'}>
      <body className="antialiased">
        <AppShell initialLang={initialLang}>{children}</AppShell>
      </body>
    </html>
  )
}
