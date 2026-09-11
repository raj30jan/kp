'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Phone, MapPin, ShoppingCart, Store, ChevronRight, Shield, CheckCircle, Truck } from 'lucide-react'
import { products } from '../products'
import { categoryTree } from '../categories'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lang, setLang] = useState('en')
  const isHindi = lang === 'hi'
  const product = useMemo(() => products.find((p) => p.id === params?.id), [params])

  if (!product) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <div className='mx-auto max-w-7xl px-4 py-20 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>{isHindi ? 'उत्पाद नहीं मिला' : 'Product not found'}</h1>
          <Link href='/marketplace' className='mt-4 inline-block text-emerald-700 hover:underline'>
            {isHindi ? 'मार्केटप्लेस पर वापस जाएं' : 'Back to Marketplace'}
          </Link>
        </div>
      </div>
    )
  }

  const related = products.filter((p) => p.categoryPath[0] === product.categoryPath[0] && p.id !== product.id).slice(0, 4)

  return (
    <div className='min-h-screen bg-slate-50'>

      <div className='mx-auto max-w-7xl px-4 py-6 md:px-6'>
        {/* Breadcrumb */}
        <div className='mb-6 flex items-center gap-1 text-sm text-gray-500'>
          <Link href='/' className='hover:text-emerald-700'>{isHindi ? 'होम' : 'Home'}</Link>
          <ChevronRight className='h-4 w-4' />
          <Link href='/marketplace' className='hover:text-emerald-700'>Marketplace</Link>
          <ChevronRight className='h-4 w-4' />
          <span className='text-gray-900'>{product.title}</span>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Image */}
          <div className='rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
            <div className='relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100'>
              <Image src={product.image} alt={product.title} fill className='object-cover' sizes='50vw' />
            </div>
          </div>

          {/* Details */}
          <div className='space-y-6'>
            <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
              <div className='flex flex-wrap gap-2'>
                {product.categoryPath.map((cat, i) => (
                  <span key={cat} className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700'>
                    {cat}
                  </span>
                ))}
              </div>
              <h1 className='mt-4 text-2xl font-bold text-gray-900'>{product.title}</h1>
              <p className='mt-3 text-3xl font-extrabold text-emerald-700'>{product.price}</p>

              <div className='mt-4 space-y-2 text-sm text-gray-600'>
                <p className='flex items-center gap-2'><MapPin className='h-4 w-4 text-emerald-600' /> {product.location}</p>
                <p className='flex items-center gap-2'><Store className='h-4 w-4 text-emerald-600' /> {isHindi ? 'विक्रेता' : 'Seller'}: {product.seller}</p>
              </div>

              <div className='mt-6 flex gap-3'>
                <button className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700'>
                  <Phone className='h-4 w-4' />
                  {isHindi ? 'संपर्क करें' : 'Contact Seller'}
                </button>
                <button className='flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100'>
                  <ShoppingCart className='h-4 w-4' />
                  {isHindi ? 'खरीदें' : 'Buy Now'}
                </button>
              </div>
            </div>

            <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
              <h2 className='mb-4 text-lg font-bold text-gray-900'>{isHindi ? 'विशेषताएँ' : 'Features'}</h2>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <CheckCircle className='h-4 w-4 text-emerald-600' />
                  {isHindi ? 'सत्यापित विक्रेता' : 'Verified Seller'}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Shield className='h-4 w-4 text-emerald-600' />
                  {isHindi ? 'सुरक्षित लेन-देन' : 'Secure Transaction'}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Truck className='h-4 w-4 text-emerald-600' />
                  {isHindi ? 'परिवहन सहायता' : 'Transport Assistance'}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <CheckCircle className='h-4 w-4 text-emerald-600' />
                  {isHindi ? 'गुणवत्ता जांच' : 'Quality Checked'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className='mt-12'>
            <h2 className='mb-6 text-xl font-bold text-gray-900'>{isHindi ? 'संबंधित उत्पाद' : 'Related Products'}</h2>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {related.map((p) => (
                <Link key={p.id} href={`/marketplace/${p.id}`} className='group flex flex-col rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden transition hover:shadow-md'>
                  <div className='relative aspect-[4/3] w-full bg-gray-100'>
                    <Image src={p.image} alt={p.title} fill className='object-cover' sizes='25vw' />
                  </div>
                  <div className='p-4'>
                    <span className='text-lg font-bold text-emerald-700'>{p.price}</span>
                    <h3 className='mt-1 line-clamp-2 text-sm font-medium text-gray-900'>{p.title}</h3>
                    <p className='mt-1 text-xs text-gray-500'><MapPin className='inline h-3 w-3' /> {p.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
