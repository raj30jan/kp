'use client'

import { Package, TrendingUp, Users, ShoppingCart, CreditCard, Phone } from 'lucide-react';

const cards = [
  { label: 'Active Listings', value: '12', change: '+2 this week', icon: Package, color: 'bg-kisan-100 text-kisan-700' },
  { label: 'Total Sales', value: '₹ 1,24,500', change: '+18% this month', icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
  { label: 'Pending Orders', value: '5', change: '2 from KisanPatrika Store', icon: ShoppingCart, color: 'bg-orange-100 text-orange-700' },
  { label: 'Hot Leads', value: '8', change: '3 need follow-up today', icon: Users, color: 'bg-red-100 text-red-700' },
  { label: 'Store Revenue', value: '₹ 42,000', change: 'Online payments only', icon: CreditCard, color: 'bg-purple-100 text-purple-700' },
  { label: 'AI Calls Today', value: '24', change: '6 transferred to agent', icon: Phone, color: 'bg-teal-100 text-teal-700' }
];

export default function KpiCards() {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className='rounded-2xl bg-white p-4 shadow-sm border border-gray-100'
          >
            <div className='flex items-start justify-between'>
              <div>
                <p className='text-xs text-gray-500'>{card.label}</p>
                <p className='mt-1 text-2xl font-bold text-gray-800'>{card.value}</p>
              </div>
              <div className={`rounded-lg p-2 ${card.color}`}>
                <Icon className='h-5 w-5' />
              </div>
            </div>
            <p className='mt-2 text-xs text-gray-500'>{card.change}</p>
          </div>
        );
      })}
    </div>
  );
}
