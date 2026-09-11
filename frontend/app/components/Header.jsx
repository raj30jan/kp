'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, Menu, LogOut } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('kp_token');
      if (token) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => { if (data?.user) setUser(data.user) })
          .catch(() => {});
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kp_token');
      localStorage.removeItem('kp_mobile');
    }
    router.push('/');
  };

  return (
    <header className='sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6'>
      <div className='flex items-center gap-3'>
        <button className='md:hidden rounded p-1 hover:bg-gray-100'>
          <Menu className='h-5 w-5' />
        </button>
        <h1 className='text-lg font-semibold text-gray-800'>My KisanPatrika</h1>
      </div>

      <div className='flex items-center gap-4'>
        <div className='hidden md:flex items-center rounded-lg bg-gray-100 px-3 py-2'>
          <Search className='h-4 w-4 text-gray-500' />
          <input
            type='text'
            placeholder='Search products, schemes...'
            className='ml-2 bg-transparent text-sm outline-none w-56'
          />
        </div>

        <button className='relative rounded-full p-2 hover:bg-gray-100'>
          <Bell className='h-5 w-5 text-gray-600' />
          <span className='absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500' />
        </button>

        <div className='flex items-center gap-2'>
          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-kisan-100 text-kisan-700'>
            <User className='h-5 w-5' />
          </div>
          <div className='hidden md:block text-sm leading-tight'>
            <p className='font-medium'>{user?.name || user?.displayName || 'User'}</p>
            <p className='text-xs capitalize text-gray-500'>{user?.role || 'user'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className='flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100'
        >
          <LogOut className='h-4 w-4' />
          <span className='hidden sm:inline'>Logout</span>
        </button>
      </div>
    </header>
  );
}
