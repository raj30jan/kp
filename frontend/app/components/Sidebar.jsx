'use client'

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
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

const menu = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { label: 'My Products', icon: Package, route: '/my-products' },
  { label: 'Marketplace', icon: Store, route: '/marketplace' },
  { label: 'My Purchases', icon: ShoppingBag, route: '/my-purchases' },
  { label: 'Categories', icon: LayoutGrid, route: '/categories' },
  { label: 'My Farm', icon: Sprout, route: '/my-farm' },
  { label: 'AI Assistant', icon: Bot, route: '/ai-assistant' },
  { label: 'Weather', icon: CloudSun, route: '/weather' },
  { label: 'Mandi Rates', icon: TrendingUp, route: '/mandi' },
  { label: 'Govt Schemes', icon: Landmark, route: '/schemes' },
  { label: 'My Buyers', icon: Users, route: '/dashboard' },
  { label: 'Analytics', icon: BarChart3, route: '/dashboard' },
  { label: 'Membership', icon: CreditCard, route: '/membership' },
  { label: 'Complaints', icon: FileWarning, route: '/complaints' },
  { label: 'Profile', icon: User, route: '/profile' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const initialActive = useMemo(() => {
    const item = menu.find((m) => m.route === pathname)
    return item ? item.label : 'Dashboard'
  }, [pathname]);
  const [active, setActive] = useState(initialActive);

  return (
    <aside className='hidden w-64 flex-col border-r bg-white p-4 md:flex h-[calc(100vh-4rem)] sticky top-16'>
      <div className='mb-6 flex items-center gap-2'>
        <Image
          src='/logo.png'
          alt='KisanPatrika — किसान पत्रिका'
          width={170}
          height={52}
          className='h-11 w-auto'
          priority
        />
      </div>

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
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className='mt-4 rounded-xl bg-kisan-50 p-3'>
        <p className='text-xs font-semibold text-kisan-800'>Membership</p>
        <p className='text-xs text-kisan-600'>Free Plan — 5 listings lifetime</p>
      </div>
    </aside>
  );
}
