'use client'

import {
  Bot,
  MessageCircle,
  Phone,
  Smartphone,
  Mail,
  MessageSquare,
  Headphones,
  Store,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  CloudRain
} from 'lucide-react';

const modules = [
  {
    title: 'AI Communication Platform',
    desc: 'One platform for chat, voice, WhatsApp, email, SMS and live agents.',
    icon: Bot,
    color: 'bg-emerald-100 text-emerald-700'
  },
  {
    title: 'AI Voicebot + Asterisk',
    desc: 'Call users, verify OTP, collect intent and transfer to live agent when needed.',
    icon: Phone,
    color: 'bg-teal-100 text-teal-700'
  },
  {
    title: 'My Products',
    desc: 'Draft, active, sold and expired listings with full lifecycle view.',
    icon: Package,
    color: 'bg-lime-100 text-lime-700'
  },
  {
    title: 'Marketplace',
    desc: 'C2C, B2B and farmer-to-buyer listings. Chat, call, negotiate and book.',
    icon: Store,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    title: 'KisanPatrika Store',
    desc: 'Our own products with cart, checkout and online payment.',
    icon: ShoppingCart,
    color: 'bg-orange-100 text-orange-700'
  },
  {
    title: 'My Buyers',
    desc: 'Interested buyers, chat history, call records and AI summaries.',
    icon: Users,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    title: 'AI Store Assistant',
    desc: 'Ask what to buy, get product and scheme recommendations.',
    icon: CloudRain,
    color: 'bg-cyan-100 text-cyan-700'
  },
  {
    title: 'Membership & Wallet',
    desc: 'Plan details, expiry, coupons and future earnings in one place.',
    icon: CreditCard,
    color: 'bg-amber-100 text-amber-700'
  }
];

const channels = [
  { name: 'AI Chatbot', icon: MessageCircle },
  { name: 'AI Voicebot', icon: Phone },
  { name: 'WhatsApp', icon: Smartphone },
  { name: 'Email', icon: Mail },
  { name: 'SMS', icon: MessageSquare },
  { name: 'Live Agent', icon: Headphones }
];

export default function ModuleGrid() {
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-lg font-semibold text-gray-800'>Quick Access</h2>
        <p className='text-sm text-gray-500'>Everything you need in one dashboard</p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.title}
              className='rounded-2xl bg-white p-5 text-left shadow-sm border border-gray-100 hover:shadow-md transition'
            >
              <div className={`mb-3 inline-flex rounded-xl p-3 ${module.color}`}>
                <Icon className='h-6 w-6' />
              </div>
              <h3 className='font-semibold text-gray-800'>{module.title}</h3>
              <p className='mt-1 text-sm text-gray-500 leading-snug'>{module.desc}</p>
            </button>
          );
        })}
      </div>

      <div className='rounded-2xl bg-white p-5 border border-gray-100 shadow-sm'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>Omnichannel Conversation History</h3>
        <div className='grid grid-cols-3 gap-3 sm:grid-cols-6'>
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div key={channel.name} className='flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-3 text-center'>
                <Icon className='h-6 w-6 text-kisan-600' />
                <span className='text-xs font-medium text-gray-700'>{channel.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
