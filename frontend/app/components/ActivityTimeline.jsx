'use client'

import { UserPlus, Package, MessageCircle, Phone, CheckCircle, CreditCard, Truck, Star } from 'lucide-react';

const events = [
  { title: 'Registered on KisanPatrika', time: '2 min ago', icon: UserPlus },
  { title: 'Added listing: Wheat Seeds 50kg', time: '1 hour ago', icon: Package },
  { title: 'AI Assistant answered weather query', time: '3 hours ago', icon: MessageCircle },
  { title: 'Voicebot verified OTP for lead #2034', time: '5 hours ago', icon: Phone },
  { title: 'Received offer on Tractor 2020', time: '1 day ago', icon: CheckCircle },
  { title: 'Accepted offer — Payment received', time: '1 day ago', icon: CreditCard },
  { title: 'Product dispatched to buyer', time: '2 days ago', icon: Truck },
  { title: 'Buyer rated the sale 5 stars', time: '3 days ago', icon: Star }
];

export default function ActivityTimeline() {
  return (
    <div className='rounded-2xl bg-white p-5 shadow-sm border border-gray-100'>
      <h3 className='mb-4 text-sm font-semibold text-gray-700'>My Activity</h3>
      <div className='space-y-4'>
        {events.map((event, index) => {
          const Icon = event.icon;
          return (
            <div key={index} className='flex items-start gap-3'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kisan-50 text-kisan-700'>
                <Icon className='h-4 w-4' />
              </div>
              <div className='flex-1 border-b border-gray-50 pb-3 last:border-0 last:pb-0'>
                <p className='text-sm font-medium text-gray-800'>{event.title}</p>
                <p className='text-xs text-gray-500'>{event.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
