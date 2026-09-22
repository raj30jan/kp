'use client'

import { useState } from 'react'
import { Shield, Lock, Eye, FileText, Users, Mail } from 'lucide-react'

export default function PrivacyPage() {
  const [lang, setLang] = useState('hi')
  const isHindi = lang === 'hi'

  const sections = [
    {
      icon: Eye,
      title: isHindi ? 'जानकारी एकत्र करना' : 'Information We Collect',
      content: isHindi
        ? 'हम आपका नाम, मोबाइल नंबर, ईमेल, पता और उत्पाद सूची जैसी जानकारी एकत्र करते हैं ताकि हम आपको बेहतर सेवाएं प्रदान कर सकें।'
        : 'We collect information such as your name, mobile number, email, address, and product listings to provide you with better services.',
    },
    {
      icon: Lock,
      title: isHindi ? 'जानकारी का उपयोग' : 'How We Use Information',
      content: isHindi
        ? 'आपकी जानकारी का उपयोग खाता बनाने, सेवाएं प्रदान करने, मंडी भाव भेजने, और महत्वपूर्ण अपडेट साझा करने के लिए किया जाता है।'
        : 'Your information is used to create your account, provide services, send mandi rates, and share important updates.',
    },
    {
      icon: Shield,
      title: isHindi ? 'डेटा सुरक्षा' : 'Data Security',
      content: isHindi
        ? 'हम उपयुक्त तकनीकी और संगठनात्मक उपायों का उपयोग करके आपके डेटा की सुरक्षा सुनिश्चित करते हैं। आपका पासवर्ड एन्क्रिप्टेड रूप में संग्रहीत है।'
        : 'We ensure the security of your data using appropriate technical and organizational measures. Your password is stored in encrypted form.',
    },
    {
      icon: Users,
      title: isHindi ? 'तीसरे पक्ष के साथ साझा करना' : 'Sharing with Third Parties',
      content: isHindi
        ? 'हम आपकी व्यक्तिगत जानकारी को आपकी सहमति के बिना किसी तीसरे पक्ष के साथ साझा नहीं करते, सिवाय कानूनी आवश्यकताओं के।'
        : 'We do not share your personal information with any third party without your consent, except for legal requirements.',
    },
    {
      icon: Mail,
      title: isHindi ? 'आपके अधिकार' : 'Your Rights',
      content: isHindi
        ? 'आपको अपनी जानकारी देखने, संपादित करने या हटाने का अधिकार है। किसी भी अनुरोध के लिए support@kisanpatrika पर संपर्क करें।'
        : 'You have the right to view, edit, or delete your information. Contact support@kisanpatrika.com for any requests.',
    },
    {
      icon: FileText,
      title: isHindi ? 'नीति में बदलाव' : 'Policy Changes',
      content: isHindi
        ? 'हम समय-समय पर इस गोपनीयता नीति को अपडेट कर सकते हैं। कोई भी बदलाव इस पृष्ठ पर पोस्ट किया जाएगा।'
        : 'We may update this privacy policy from time to time. Any changes will be posted on this page.',
    },
  ]

  return (
    <div className='min-h-screen bg-slate-50'>

      <section className='bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 py-16 text-white'>
        <div className='mx-auto max-w-7xl px-4 text-center md:px-6'>
          <Shield className='mx-auto mb-4 h-12 w-12 text-emerald-300' />
          <h1 className='text-4xl font-extrabold tracking-tight md:text-5xl'>
            {isHindi ? 'गोपनीयता नीति' : 'Privacy Policy'}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-emerald-100'>
            {isHindi ? 'आपकी गोपनीयता हमारे लिए महत्वपूर्ण है' : 'Your privacy is important to us'}
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-4 py-16 md:px-6'>
        <div className='space-y-6'>
          {sections.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.title} className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
                <div className='flex items-start gap-4'>
                  <span className='rounded-xl bg-emerald-50 p-3 text-emerald-700'>
                    <Icon className='h-6 w-6' />
                  </span>
                  <div>
                    <h2 className='text-lg font-bold text-gray-900'>{s.title}</h2>
                    <p className='mt-2 text-sm leading-relaxed text-gray-600'>{s.content}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <p className='mt-8 text-center text-sm text-gray-500'>
          {isHindi ? 'अंतिम अपडेट: ' : 'Last updated: '} {new Date().toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN')}
        </p>
      </section>

    </div>
  )
}
