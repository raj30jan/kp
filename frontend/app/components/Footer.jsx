'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, Facebook, Twitter, Instagram, Users } from 'lucide-react'
import { api } from '../../lib/api'
import { getSessionId } from '../../lib/session'

export default function Footer({ lang = 'hi' }) {
  const isHindi = lang === 'hi'
  const [visitors, setVisitors] = useState(null)

  // Count this visit once per browser session, then fetch the live total.
  useEffect(() => {
    const sessionId = getSessionId()
    api
      .trackVisit(sessionId)
      .then(() => api.getPublicStats())
      .then((s) => setVisitors(s?.visitors ?? null))
      .catch(() => {})
  }, [])

  return (
    <footer className='bg-gray-900 py-12 text-gray-300'>
      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-5'>
          <div>
            <div className='flex items-center gap-2'>
              <Image
                src={isHindi ? '/logo-hi.png' : '/logo-en.png'}
                alt={isHindi ? 'किसानपत्रिका' : 'KisanPatrika'}
                width={180}
                height={60}
                className='h-12 w-auto rounded-lg bg-white p-1'
              />
            </div>
            <p className='mt-3 text-sm'>
              {isHindi
                ? 'किसानों के लिए एक विश्वसनीय डिजिटल प्लेटफॉर्म।'
                : 'A trusted digital platform for farmers and agro businesses.'}
            </p>
          </div>
          <div>
            <h4 className='mb-3 font-semibold text-white'>
              {isHindi ? 'हमारे बारे में' : 'About Us'}
            </h4>
            <ul className='space-y-2 text-sm'>
              <li><Link href='/about' className='hover:text-emerald-400'>{isHindi ? 'हमारे बारे में' : 'About Us'}</Link></li>
              <li><Link href='/membership' className='hover:text-emerald-400'>{isHindi ? 'सदस्यता' : 'Membership'}</Link></li>
              <li><Link href='/privacy' className='hover:text-emerald-400'>{isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className='mb-3 font-semibold text-white'>
              {isHindi ? 'सहायता' : 'Help'}
            </h4>
            <ul className='space-y-2 text-sm'>
              <li><Link href='/help' className='hover:text-emerald-400'>{isHindi ? 'सहायता' : 'Help & FAQ'}</Link></li>
              <li><Link href='/contact' className='hover:text-emerald-400'>{isHindi ? 'संपर्क करें' : 'Contact'}</Link></li>
              <li><Link href='/marketplace' className='hover:text-emerald-400'>Marketplace</Link></li>
              <li><Link href='/categories' className='hover:text-emerald-400'>{isHindi ? 'श्रेणियाँ' : 'Categories'}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className='mb-3 font-semibold text-white'>
              {isHindi ? 'सरकारी और निःशुल्क सेवाएँ' : 'Govt & Free Services'}
            </h4>
            <ul className='space-y-2 text-sm'>
              <li><Link href='/service?name=AI+Assistant' className='hover:text-emerald-400'>{isHindi ? 'AI सहायक' : 'AI Assistant'}</Link></li>
              <li><Link href='/mandi' className='hover:text-emerald-400'>{isHindi ? 'मंडी भाव' : 'Mandi Bhav'}</Link></li>
              <li><Link href='/schemes' className='hover:text-emerald-400'>{isHindi ? 'सरकारी योजनाएँ' : 'Govt. Schemes'}</Link></li>
              <li><Link href='/schemes' className='hover:text-emerald-400'>{isHindi ? 'सब्सिडी और ऋण' : 'Subsidy & Loans'}</Link></li>
              <li>
                {/* IMD (Govt of India) — opens in a new tab per request */}
                <a
                  href='https://mausam.imd.gov.in/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-emerald-400'
                >
                  {isHindi ? 'मौसम पूर्वानुमान (IMD)' : 'Weather Forecast (IMD) ↗'}
                </a>
              </li>
              <li>
                <a
                  href='https://agmarknet.gov.in/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hover:text-emerald-400'
                >
                  {isHindi ? 'एगमार्कनेट मंडी भाव' : 'Agmarknet Mandi Rates ↗'}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className='mb-3 font-semibold text-white'>
              {isHindi ? 'संपर्क करें' : 'Contact'}
            </h4>
            <ul className='space-y-2 text-sm'>
              <li className='flex items-center gap-2'>
                <Phone className='h-4 w-4' />
                +91-1800-123-4567
              </li>
              <li className='flex items-center gap-2'>
                <Mail className='h-4 w-4' />
                support@kisanpatrika.com
              </li>
              <li className='flex items-center gap-3 pt-2'>
                <Facebook className='h-5 w-5 cursor-pointer hover:text-emerald-400' />
                <Twitter className='h-5 w-5 cursor-pointer hover:text-emerald-400' />
                <Instagram className='h-5 w-5 cursor-pointer hover:text-emerald-400' />
              </li>
            </ul>
          </div>
        </div>
        <div className='mt-10 border-t border-gray-800 pt-6 text-center'>
          <p className='text-sm font-semibold text-emerald-400'>
            {isHindi ? '"हर किसान की अपनी पत्रिका"' : '"Har Kisan Ki Apni Patrika"'}
          </p>
          {visitors !== null && (
            <p className='mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-400'>
              <Users className='h-3.5 w-3.5 text-emerald-400' />
              {isHindi
                ? `${visitors.toLocaleString('hi-IN')} विज़िटर`
                : `${visitors.toLocaleString('en-IN')} visitors`}
            </p>
          )}
          <p className='mt-2 text-xs text-gray-500'>
            © {new Date().getFullYear()} KisanPatrika. {isHindi ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  )
}
