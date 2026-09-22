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
import { useLang } from '../../lib/lang-context';

const modules = [
  {
    title: 'AI Communication Platform', titleHi: 'AI संचार मंच',
    desc: 'One platform for chat, voice, WhatsApp, email, SMS and live agents.',
    descHi: 'चैट, वॉइस, WhatsApp, ईमेल, SMS और लाइव एजेंट के लिए एक मंच।',
    icon: Bot,
    color: 'bg-emerald-100 text-emerald-700'
  },
  {
    title: 'AI Voicebot + Asterisk', titleHi: 'AI वॉइसबॉट + Asterisk',
    desc: 'Call users, verify OTP, collect intent and transfer to live agent when needed.',
    descHi: 'उपयोगकर्ताओं को कॉल करें, OTP सत्यापित करें, इरादा जानें और ज़रूरत पर लाइव एजेंट को ट्रांसफर करें।',
    icon: Phone,
    color: 'bg-teal-100 text-teal-700'
  },
  {
    title: 'My Products', titleHi: 'मेरे उत्पाद',
    desc: 'Draft, active, sold and expired listings with full lifecycle view.',
    descHi: 'ड्राफ़्ट, सक्रिय, बिकी और समाप्त लिस्टिंग का पूरा जीवनचक्र दृश्य।',
    icon: Package,
    color: 'bg-lime-100 text-lime-700'
  },
  {
    title: 'Marketplace', titleHi: 'मार्केटप्लेस',
    desc: 'C2C, B2B and farmer-to-buyer listings. Chat, call, negotiate and book.',
    descHi: 'C2C, B2B और किसान-से-खरीदार लिस्टिंग। चैट, कॉल, मोलभाव और बुक करें।',
    icon: Store,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    title: 'KisanPatrika Store', titleHi: 'किसानपत्रिका स्टोर',
    desc: 'Our own products with cart, checkout and online payment.',
    descHi: 'कार्ट, चेकआउट और ऑनलाइन भुगतान के साथ हमारे अपने उत्पाद।',
    icon: ShoppingCart,
    color: 'bg-orange-100 text-orange-700'
  },
  {
    title: 'My Buyers', titleHi: 'मेरे खरीदार',
    desc: 'Interested buyers, chat history, call records and AI summaries.',
    descHi: 'इच्छुक खरीदार, चैट इतिहास, कॉल रिकॉर्ड और AI सारांश।',
    icon: Users,
    color: 'bg-purple-100 text-purple-700'
  },
  {
    title: 'AI Store Assistant', titleHi: 'AI स्टोर सहायक',
    desc: 'Ask what to buy, get product and scheme recommendations.',
    descHi: 'क्या खरीदें पूछें, उत्पाद और योजना सुझाव पाएँ।',
    icon: CloudRain,
    color: 'bg-cyan-100 text-cyan-700'
  },
  {
    title: 'Membership & Wallet', titleHi: 'मेंबरशिप और वॉलेट',
    desc: 'Plan details, expiry, coupons and future earnings in one place.',
    descHi: 'प्लान विवरण, समाप्ति, कूपन और भविष्य की कमाई एक ही जगह।',
    icon: CreditCard,
    color: 'bg-amber-100 text-amber-700'
  }
];

const channels = [
  { name: 'AI Chatbot', nameHi: 'AI चैटबॉट', icon: MessageCircle },
  { name: 'AI Voicebot', nameHi: 'AI वॉइसबॉट', icon: Phone },
  { name: 'WhatsApp', nameHi: 'WhatsApp', icon: Smartphone },
  { name: 'Email', nameHi: 'ईमेल', icon: Mail },
  { name: 'SMS', nameHi: 'SMS', icon: MessageSquare },
  { name: 'Live Agent', nameHi: 'लाइव एजेंट', icon: Headphones }
];

const t = {
  en: { quickAccess: 'Quick Access', quickSub: 'Everything you need in one dashboard', omni: 'Omnichannel Conversation History' },
  hi: { quickAccess: 'त्वरित पहुँच', quickSub: 'एक डैशबोर्ड में आपकी हर ज़रूरत', omni: 'ओमनीचैनल वार्तालाप इतिहास' },
}

export default function ModuleGrid() {
  const { lang } = useLang();
  const text = t[lang] || t.en;
  const isHindi = lang === 'hi';
  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-lg font-semibold text-gray-800'>{text.quickAccess}</h2>
        <p className='text-sm text-gray-500'>{text.quickSub}</p>
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
              <h3 className='font-semibold text-gray-800'>{isHindi ? module.titleHi : module.title}</h3>
              <p className='mt-1 text-sm text-gray-500 leading-snug'>{isHindi ? module.descHi : module.desc}</p>
            </button>
          );
        })}
      </div>

      <div className='rounded-2xl bg-white p-5 border border-gray-100 shadow-sm'>
        <h3 className='mb-4 text-sm font-semibold text-gray-700'>{text.omni}</h3>
        <div className='grid grid-cols-3 gap-3 sm:grid-cols-6'>
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div key={channel.name} className='flex flex-col items-center gap-2 rounded-xl bg-gray-50 p-3 text-center'>
                <Icon className='h-6 w-6 text-kisan-600' />
                <span className='text-xs font-medium text-gray-700'>{isHindi ? channel.nameHi : channel.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
