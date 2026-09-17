'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, MapPin, ShoppingCart, Store, ChevronRight, Shield, CheckCircle, Truck, Loader2, ArrowLeft, Mail, X } from 'lucide-react'
import { api, API_BASE } from '../../../lib/api'
import { useLang } from '../../../lib/lang-context'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const t = {
  en: {
    backToMarketplace: 'Back to Marketplace',
    home: 'Home',
    marketplace: 'Marketplace',
    contactSeller: 'Contact Seller',
    backToListings: 'Back to Listings',
    features: 'Features',
    verifiedSeller: 'Verified Seller',
    secureTransaction: 'Secure Transaction',
    transportAssistance: 'Transport Assistance',
    qualityChecked: 'Quality Checked',
    sellerDetails: 'Seller Details',
    needLogin: 'Please log in to view seller contact details.',
    login: 'Login',
    contactError: 'Could not fetch seller details',
    productNotFound: 'Product not found',
    loadError: 'Failed to load product',
  },
  hi: {
    backToMarketplace: 'मार्केटप्लेस पर वापस',
    home: 'होम',
    marketplace: 'मार्केटप्लेस',
    contactSeller: 'विक्रेता से संपर्क करें',
    backToListings: 'सूची पर वापस',
    features: 'विशेषताएँ',
    verifiedSeller: 'सत्यापित विक्रेता',
    secureTransaction: 'सुरक्षित लेन-देन',
    transportAssistance: 'परिवहन सहायता',
    qualityChecked: 'गुणवत्ता जाँच',
    sellerDetails: 'विक्रेताकी जानकारी',
    needLogin: 'विक्रेताकी संपर्क जानकारी देखने के लिए लॉग इन करें।',
    login: 'लॉग इन',
    contactError: 'विक्रेताकी जानकारी प्राप्त नहीं हो सकी',
    productNotFound: 'उत्पाद नहीं मिला',
    loadError: 'उत्पाद लोड करनें में विफल',
  },
}

function productImages(p) {
  if (!p.imageUrls) return []
  const imgs = Array.isArray(p.imageUrls) ? p.imageUrls : [p.imageUrls]
  return imgs.map((img) => {
    if (typeof img === 'string') return BACKEND_URL + img
    if (img?.full) return BACKEND_URL + img.full
    if (img?.thumb) return BACKEND_URL + img.thumb
    return null
  }).filter(Boolean)
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { lang } = useLang()
  const text = t[lang]
  const [activeImage, setActiveImage] = useState(0)
  const [categoryTree, setCategoryTree] = useState([])

  useEffect(() => {
    api.getCategoryTree()
      .then((res) => setCategoryTree(res?.tree || []))
      .catch(() => setCategoryTree([]))
  }, [])

  const categoryNameMap = useMemo(() => {
    const map = {}
    const walk = (nodes) => {
      for (const n of nodes || []) {
        map[n.slug] = lang === 'hi' ? (n.nameHi || n.name) : n.name
        if (n.children?.length) walk(n.children)
      }
    }
    walk(categoryTree)
    return map
  }, [categoryTree, lang])
  const [contactModal, setContactModal] = useState(null)
  const [contactLoading, setContactLoading] = useState(false)

  useEffect(() => {
    if (params?.id) loadProduct()
  }, [params?.id])

  const loadProduct = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getProduct(params.id)
      setProduct(res)
    } catch (err) {
      setError(err?.message || text.loadError)
    } finally {
      setLoading(false)
    }
  }

  const handleContactSeller = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token) {
      setContactModal({ needLogin: true })
      return
    }
    setContactLoading(true)
    try {
      const res = await api.contactSeller(params.id, token)
      setContactModal({ seller: res })
    } catch (err) {
      setContactModal({ error: err?.message || 'Could not fetch seller details' })
    } finally {
      setContactLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <div className='flex min-h-screen items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className='min-h-screen bg-slate-50'>
        <div className='mx-auto max-w-7xl px-4 py-20 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>{error || text.productNotFound}</h1>
          <Link href='/marketplace' className='mt-4 inline-block text-emerald-700 hover:underline'>
            {text.backToMarketplace}
          </Link>
        </div>
      </div>
    )
  }

  const images = productImages(product)

  return (
    <div className='min-h-screen bg-slate-50'>
      {/* Header */}
      <header className='sticky top-0 z-40 border-b bg-white/95 backdrop-blur'>
        <div className='mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-6'>
          <button onClick={() => router.push('/marketplace')} className='flex items-center gap-2'>
            <ArrowLeft className='h-5 w-5 text-emerald-700' />
            <span className='text-sm font-semibold text-gray-700'>{text.backToMarketplace}</span>
          </button>
        </div>
      </header>

      <div className='mx-auto max-w-7xl px-4 py-6 md:px-6'>
        {/* Breadcrumb */}
        <div className='mb-6 flex items-center gap-1 text-sm text-gray-500'>
          <Link href='/' className='hover:text-emerald-700'>{text.home}</Link>
          <ChevronRight className='h-4 w-4' />
          <Link href='/marketplace' className='hover:text-emerald-700'>{text.marketplace}</Link>
          <ChevronRight className='h-4 w-4' />
          <span className='text-gray-900'>{product.title}</span>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Image Gallery */}
          <div className='space-y-3'>
            <div className='rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
              <div className='relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100'>
                {images.length > 0 ? (
                  <img
                    src={images[activeImage] || images[0]}
                    alt={product.titleHi && lang === 'hi' ? product.titleHi : product.title}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center text-gray-400'>
                    <ShoppingCart className='h-16 w-16' />
                  </div>
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className='flex gap-2 overflow-x-auto'>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${i === activeImage ? 'border-emerald-600' : 'border-gray-200'}`}
                  >
                    <img src={img} alt={`Image ${i + 1}`} className='h-full w-full object-cover' />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className='space-y-6'>
            <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
              {product.category && (
                <span className='inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700'>
                  {categoryNameMap[product.category] || product.category}
                </span>
              )}
              <h1 className='mt-3 text-2xl font-bold text-gray-900'>{product.titleHi && lang === 'hi' ? product.titleHi : product.title}</h1>
              {product.description && (
                <p className='mt-3 text-sm text-gray-600'>{product.description}</p>
              )}

              <div className='mt-4 flex items-baseline gap-1'>
                <span className='text-3xl font-extrabold text-emerald-700'>₹{product.price}</span>
                {product.priceUnit && (
                  <span className='text-sm font-normal text-gray-500'>/ {product.priceUnit.replace(/_/g, ' ')}</span>
                )}
              </div>

              {product.quantity && (
                <p className='mt-2 text-sm text-gray-600'>
                  Available: <span className='font-semibold'>{product.quantity} {product.quantityUnit?.replace(/_/g, ' ') || ''}</span>
                </p>
              )}

              <div className='mt-4 space-y-2 text-sm text-gray-600'>
                <p className='flex items-center gap-2'>
                  <MapPin className='h-4 w-4 text-emerald-600' />
                  {product.location || [product.district, product.state].filter(Boolean).join(', ') || 'Location not set'}
                </p>
                {product.mobile && (
                  <p className='flex items-center gap-2'>
                    <Phone className='h-4 w-4 text-emerald-600' />
                    {product.mobile}
                  </p>
                )}
              </div>

              <div className='mt-6 flex gap-3'>
                <button
                  onClick={handleContactSeller}
                  disabled={contactLoading}
                  className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'
                >
                  {contactLoading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Phone className='h-4 w-4' />
                  )}
                  {text.contactSeller}
                </button>
                <Link
                  href='/marketplace'
                  className='flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100'
                >
                  <ShoppingCart className='h-4 w-4' />
                  {text.backToListings}
                </Link>
              </div>
            </div>

            <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
              <h2 className='mb-4 text-lg font-bold text-gray-900'>{text.features}</h2>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <CheckCircle className='h-4 w-4 text-emerald-600' />
                  {text.verifiedSeller}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Shield className='h-4 w-4 text-emerald-600' />
                  {text.secureTransaction}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Truck className='h-4 w-4 text-emerald-600' />
                  {text.transportAssistance}
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <CheckCircle className='h-4 w-4 text-emerald-600' />
                  {text.qualityChecked}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Seller Modal */}
      {contactModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-bold text-gray-900'>{text.sellerDetails}</h2>
              <button onClick={() => setContactModal(null)} className='text-gray-400 hover:text-gray-600'>
                <X className='h-5 w-5' />
              </button>
            </div>

            {contactModal.needLogin ? (
              <div className='text-center'>
                <p className='text-sm text-gray-600'>{text.needLogin}</p>
                <Link
                  href='/login?redirect=/marketplace'
                  className='mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
                >
                  {text.login}
                </Link>
              </div>
            ) : contactModal.error ? (
              <p className='text-sm text-red-600'>{contactModal.error || text.contactError}</p>
            ) : contactModal.seller ? (
              <div className='space-y-3'>
                {contactModal.seller.sellerName && (
                  <div className='flex items-center gap-2 text-sm'>
                    <Store className='h-4 w-4 text-emerald-600' />
                    <span className='font-medium text-gray-700'>{contactModal.seller.sellerName}</span>
                  </div>
                )}
                {contactModal.seller.mobile && (
                  <div className='flex items-center gap-2 text-sm'>
                    <Phone className='h-4 w-4 text-emerald-600' />
                    <a href={`tel:${contactModal.seller.mobile}`} className='font-medium text-emerald-700 hover:underline'>
                      {contactModal.seller.mobile}
                    </a>
                  </div>
                )}
                {contactModal.seller.email && (
                  <div className='flex items-center gap-2 text-sm'>
                    <Mail className='h-4 w-4 text-emerald-600' />
                    <a href={`mailto:${contactModal.seller.email}`} className='font-medium text-emerald-700 hover:underline'>
                      {contactModal.seller.email}
                    </a>
                  </div>
                )}
                {contactModal.seller.location && (
                  <div className='flex items-center gap-2 text-sm'>
                    <MapPin className='h-4 w-4 text-emerald-600' />
                    <span className='text-gray-600'>{contactModal.seller.location}</span>
                  </div>
                )}
                {contactModal.seller.message && (
                  <p className='rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>{contactModal.seller.message}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
