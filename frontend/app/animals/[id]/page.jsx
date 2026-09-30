'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Milk,
  PawPrint,
  Eye,
} from 'lucide-react'
import { api, API_BASE } from '../../../lib/api'
import { useLang } from '../../../lib/lang-context'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const t = {
  en: {
    home: 'Home',
    marketplace: 'Animal Market',
    back: 'Back to Animal Market',
    notFound: 'Listing not found',
    loadError: 'Could not load this listing',
    description: 'Description',
    noDescription: 'No description provided',
    details: 'Animal Details',
    type: 'Type',
    breed: 'Breed',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    age: 'Age',
    milk: 'Milk capacity',
    lactation: 'Lactation (byaat)',
    pregnant: 'Pregnant',
    yes: 'Yes',
    no: 'No',
    months: 'months',
    negotiable: 'Negotiable',
    fixedPrice: 'Fixed price',
    views: 'views',
    seller: 'Seller Contact',
    call: 'Call Seller',
    location: 'Location',
    video: 'Animal video',
    listed: 'Listed on',
    years: 'yrs',
    monthsShort: 'm',
  },
  hi: {
    home: 'होम',
    marketplace: 'पशु बाज़ार',
    back: 'पशु बाज़ार पर वापस',
    notFound: 'लिस्टिंग नहीं मिली',
    loadError: 'लिस्टिंग लोड नहीं हो सकी',
    description: 'विवरण',
    noDescription: 'कोई विवरण नहीं',
    details: 'पशु विवरण',
    type: 'प्रकार',
    breed: 'नस्ल',
    gender: 'लिंग',
    male: 'नर',
    female: 'मादा',
    age: 'उम्र',
    milk: 'दूध क्षमता',
    lactation: 'ब्यात',
    pregnant: 'गर्भित',
    yes: 'हाँ',
    no: 'नहीं',
    months: 'महीने',
    negotiable: 'मोल-भाव संभव',
    fixedPrice: 'निश्चित मूल्य',
    views: 'बार देखा गया',
    seller: 'विक्रेता संपर्क',
    call: 'विक्रेता को कॉल करें',
    location: 'स्थान',
    video: 'पशु वीडियो',
    listed: 'सूचीबद्ध तिथि',
    years: 'वर्ष',
    monthsShort: 'माह',
  },
}

function images(l) {
  return (l?.images || [])
    .map((img) => ({ thumb: img.thumbUrl ? BACKEND_URL + img.thumbUrl : null, full: img.imageUrl ? BACKEND_URL + img.imageUrl : img.thumbUrl ? BACKEND_URL + img.thumbUrl : null }))
    .filter((i) => i.full)
}

export default function AnimalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { lang } = useLang()
  const text = t[lang] || t.en
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    api.getAnimal(params.id)
      .then(setListing)
      .catch((e) => setError(e?.message || text.loadError))
      .finally(() => setLoading(false))
  }, [params.id])

  const photos = images(listing)
  const age = [
    listing?.ageYears ? `${listing.ageYears} ${text.years}` : '',
    listing?.ageMonths ? `${listing.ageMonths} ${text.monthsShort}` : '',
  ].filter(Boolean).join(' ')

  const rows = listing
    ? [
        [text.type, lang === 'hi' ? listing.type?.nameHi || listing.type?.name : listing.type?.name],
        [text.breed, listing.breed?.name],
        [text.gender, listing.gender === 'male' ? text.male : text.female],
        [text.age, age || null],
        [text.milk, listing.milkCapacity != null ? `${listing.milkCapacity} L/day` : null],
        [text.lactation, listing.lactationNumber != null ? String(listing.lactationNumber) : null],
        [
          text.pregnant,
          listing.isPregnant
            ? `${text.yes}${listing.monthsPregnant ? ` (${listing.monthsPregnant} ${text.months})` : ''}`
            : text.no,
        ],
      ].filter(([, v]) => v != null && v !== '')
    : []

  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='sticky top-0 z-50 border-b bg-white/95 backdrop-blur'>
        <div className='mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6'>
          <button onClick={() => router.push('/marketplace?group=animals')} className='rounded-full p-1.5 hover:bg-gray-100'>
            <ArrowLeft className='h-5 w-5 text-emerald-700' />
          </button>
          <div className='flex items-center gap-1 text-sm'>
            <Link href='/' className='text-gray-600 hover:text-emerald-700'>{text.home}</Link>
            <ChevronRight className='h-4 w-4 text-gray-400' />
            <Link href='/marketplace?group=animals' className='text-gray-600 hover:text-emerald-700'>
              {text.marketplace}
            </Link>
            <ChevronRight className='h-4 w-4 text-gray-400' />
            <span className='line-clamp-1 max-w-40 font-medium text-emerald-700'>
              {listing?.title || '…'}
            </span>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10'>
        {loading ? (
          <div className='flex h-64 items-center justify-center'>
            <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
          </div>
        ) : error || !listing ? (
          <div className='rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-100'>
            <PawPrint className='mx-auto h-12 w-12 text-gray-300' />
            <h3 className='mt-4 text-lg font-semibold text-gray-900'>{error || text.notFound}</h3>
            <Link
              href='/marketplace?group=animals'
              className='mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
            >
              {text.back}
            </Link>
          </div>
        ) : (
          <div className='grid gap-8 lg:grid-cols-2'>
            {/* Gallery */}
            <div>
              <div className='relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200'>
                {photos.length ? (
                  <img
                    src={photos[Math.min(active, photos.length - 1)].full}
                    alt={listing.title || ''}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center text-gray-300'>
                    <PawPrint className='h-16 w-16' />
                  </div>
                )}
                <span className='absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white'>
                  {lang === 'hi' ? listing.type?.nameHi || listing.type?.name : listing.type?.name}
                  {listing.breed?.name ? ` · ${listing.breed.name}` : ''}
                </span>
              </div>
              {photos.length > 1 && (
                <div className='mt-3 flex gap-2 overflow-x-auto'>
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 ${i === active ? 'ring-emerald-600' : 'ring-transparent'}`}
                    >
                      <img src={p.thumb || p.full} alt='' className='h-full w-full object-cover' />
                    </button>
                  ))}
                </div>
              )}
              {listing.videoUrl && (
                <div className='mt-4'>
                  <p className='mb-2 text-sm font-semibold text-gray-700'>{text.video}</p>
                  <video
                    src={BACKEND_URL + listing.videoUrl}
                    controls
                    className='w-full rounded-2xl bg-black ring-1 ring-gray-200'
                  />
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h1 className='text-2xl font-bold text-gray-900 md:text-3xl'>{listing.title}</h1>
              <div className='mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500'>
                <span className='flex items-center gap-1'>
                  <Eye className='h-4 w-4' /> {listing.views || 0} {text.views}
                </span>
                <span>
                  {text.listed} {new Date(listing.createdAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                </span>
              </div>

              <div className='mt-4 flex items-baseline gap-2'>
                <span className='text-3xl font-extrabold text-emerald-700'>
                  ₹{Number(listing.price || 0).toLocaleString('en-IN')}
                </span>
                <span className='text-sm font-medium text-gray-500'>
                  {listing.isNegotiable ? text.negotiable : text.fixedPrice}
                </span>
              </div>

              <div className='mt-5 flex items-start gap-2 rounded-xl bg-white p-4 text-sm text-gray-600 ring-1 ring-gray-100'>
                <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-emerald-600' />
                <span>{listing.location || [listing.district, listing.state].filter(Boolean).join(', ')}</span>
              </div>

              {/* Spec grid */}
              <div className='mt-6'>
                <h2 className='mb-3 flex items-center gap-2 text-lg font-bold text-gray-900'>
                  <Milk className='h-5 w-5 text-emerald-600' /> {text.details}
                </h2>
                <dl className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                  {rows.map(([k, v]) => (
                    <div key={k} className='rounded-xl bg-white p-3 ring-1 ring-gray-100'>
                      <dt className='text-xs text-gray-500'>{k}</dt>
                      <dd className='mt-0.5 text-sm font-semibold text-gray-900'>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Description */}
              <div className='mt-6'>
                <h2 className='mb-2 text-lg font-bold text-gray-900'>{text.description}</h2>
                <p className='whitespace-pre-line rounded-xl bg-white p-4 text-sm text-gray-600 ring-1 ring-gray-100'>
                  {listing.description || text.noDescription}
                </p>
              </div>

              {/* Contact */}
              <div className='mt-6 rounded-2xl bg-white p-5 ring-1 ring-gray-100'>
                <h2 className='text-lg font-bold text-gray-900'>{text.seller}</h2>
                <div className='mt-3 flex flex-wrap gap-3'>
                  {listing.mobile && (
                    <a
                      href={`tel:${listing.mobile}`}
                      className='flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700'
                    >
                      <Phone className='h-4 w-4' /> {listing.mobile}
                    </a>
                  )}
                  {listing.email && (
                    <a
                      href={`mailto:${listing.email}`}
                      className='flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100'
                    >
                      <Mail className='h-4 w-4' /> {listing.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
