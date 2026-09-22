'use client'

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Store,
  Bot,
  Users,
  BarChart3,
  CreditCard,
  Sprout,
  LayoutGrid,
  CloudSun,
  TrendingUp,
  Landmark,
  User,
  ShoppingBag,
  FileWarning,
} from 'lucide-react';
import { useLang } from '../../lib/lang-context';

const menu = [
  { label: 'Dashboard', labelHi: 'डैशबोर्ड', icon: LayoutDashboard, route: '/dashboard' },
  { label: 'My Products', labelHi: 'मेरे उत्पाद', icon: Package, route: '/my-products' },
  { label: 'Marketplace', labelHi: 'मार्केटप्लेस', icon: Store, route: '/marketplace' },
  { label: 'My Purchases', labelHi: 'मेरी खरीद', icon: ShoppingBag, route: '/my-interests?tab=cart' },
  { label: 'Categories', labelHi: 'श्रेणियाँ', icon: LayoutGrid, route: '/categories' },
  { label: 'My Farm', labelHi: 'मेरा फ़ार्म', icon: Sprout, route: '/my-farm' },
  { label: 'AI Assistant', labelHi: 'AI सहायक', icon: Bot, route: '/ai-assistant' },
  { label: 'Weather', labelHi: 'मौसम', icon: CloudSun, route: '/weather' },
  { label: 'Mandi Rates', labelHi: 'मंडी भाव', icon: TrendingUp, route: '/mandi' },
  { label: 'Govt Schemes', labelHi: 'सरकारी योजनाएँ', icon: Landmark, route: '/schemes' },
  { label: 'My Buyers', labelHi: 'मेरे खरीदार', icon: Users, route: '/dashboard' },
  { label: 'Analytics', labelHi: 'एनालिटिक्स', icon: BarChart3, route: '/dashboard' },
  { label: 'Membership', labelHi: 'मेंबरशिप', icon: CreditCard, route: '/membership' },
  { label: 'Complaints', labelHi: 'शिकायतें', icon: FileWarning, route: '/complaints' },
  { label: 'Profile', labelHi: 'प्रोफ़ाइल', icon: User, route: '/profile' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { lang } = useLang();
  const isHindi = lang === 'hi';
  const initialActive = useMemo(() => {
    const item = menu.find((m) => m.route === pathname)
    return item ? item.label : 'Dashboard'
  }, [pathname]);
  const [active, setActive] = useState(initialActive);

  return (
    <aside className='hidden w-64 flex-col border-r bg-white p-4 md:flex h-[calc(100vh-73px)] sticky top-[73px]'>
      <p className='mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
        {isHindi ? 'मेन्यू' : 'Menu'}
      </p>

      <nav className='flex-1 space-y-1 overflow-auto'>
        {menu.map((item) => {
          const Icon = item.icon;
          const selected = item.label === active;
          return (
            <button
              key={item.label}
              onClick={() => {
                setActive(item.label)
                if (item.route) router.push(item.route)
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                selected ? 'bg-kisan-50 text-kisan-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className='h-5 w-5' />
              {isHindi ? item.labelHi : item.label}
            </button>
          );
        })}
      </nav>

      <div className='mt-4 rounded-xl bg-kisan-50 p-3'>
        <p className='text-xs font-semibold text-kisan-800'>{isHindi ? 'मेंबरशिप' : 'Membership'}</p>
        <p className='text-xs text-kisan-600'>{isHindi ? 'फ्री प्लान — लाइफ़टाइम 5 लिस्टिंग' : 'Free Plan — 5 listings lifetime'}</p>
      </div>
    </aside>
  );
}
