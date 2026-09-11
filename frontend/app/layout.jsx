import './globals.css'
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
  return (
    <html lang="en">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
