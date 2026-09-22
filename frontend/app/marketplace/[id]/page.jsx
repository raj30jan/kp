'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Phone, MapPin, ShoppingCart, Store, ChevronRight, Shield, CheckCircle, Truck, Loader2, ArrowLeft, Mail, X, Heart, ZoomIn, ChevronLeft, LogIn } from 'lucide-react'
import { api, API_BASE, notifyInterestsChanged } from '../../../lib/api'
import { useLang } from '../../../lib/lang-context'
import { displayTitle, unitLabel, landRatePerAcre } from '../../../lib/product-utils'

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
    loginRequiredTitle: 'Login required',
    loginRequiredBody: 'To protect our sellers from spam and unsolicited calls, contact details are shared only with verified KisanPatrika members. Please log in or create a free account to continue.',
    sessionExpiredTitle: 'Your session has expired',
    sessionExpiredBody: 'For your security you were signed out after a period of inactivity. Please log in again to view the seller\'s contact details.',
    login: 'Login',
    register: 'Create free account',
    contactError: 'Could not fetch seller details',
    productNotFound: 'Product not found',
    loadError: 'Failed to load product',
    totalLabel: 'Total',
    perAcre: 'per acre',
    addWishlist: 'Save to Wishlist',
    inWishlist: 'In Wishlist',
    addCart: 'Add to Bucket',
    inCart: 'In Bucket',
    membershipRequired: 'Membership required',
    membershipBody: 'Seller mobile numbers and email addresses are shared only with paid members. This keeps our sellers safe from spam and ensures every enquiry comes from a genuine buyer. Choose a plan to unlock unlimited seller contacts.',
    viewMembership: 'View Membership Plans',
    videoLabel: 'Product video',
    zoomHint: 'Click to zoom',
    interestLoginTitle: 'Please log in to save this product',
    interestLoginBody: 'Your wishlist and buying bucket are saved to your account so they are waiting for you on any device. Log in or register free to use them.',
    interestFailed: 'Could not update your list. Please try again.',
    addedWishlist: 'Saved to your wishlist',
    addedCart: 'Added to your buying bucket',
    removedWishlist: 'Removed from wishlist',
    removedCart: 'Removed from buying bucket',
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
    sellerDetails: 'विक्रेता की जानकारी',
    needLogin: 'विक्रेता की संपर्क जानकारी देखने के लिए लॉग इन करें।',
    loginRequiredTitle: 'लॉग इन आवश्यक',
    loginRequiredBody: 'विक्रेताओं को स्पैम और अनचाहे कॉल से बचाने के लिए संपर्क विवरण केवल सत्यापित किसान पत्रिका सदस्यों के साथ साझा किया जाता है। कृपया लॉग इन करें या मुफ़्त खाता बनाएं।',
    sessionExpiredTitle: 'आपका सेशन समाप्त हो गया',
    sessionExpiredBody: 'आपकी सुरक्षा के लिए निष्क्रियता के बाद आपको साइन आउट कर दिया गया। विक्रेता का संपर्क देखने के लिए कृपया फिर से लॉग इन करें।',
    login: 'लॉग इन',
    register: 'मुफ़्त खाता बनाएं',
    contactError: 'विक्रेताकी जानकारी प्राप्त नहीं हो सकी',
    productNotFound: 'उत्पाद नहीं मिला',
    loadError: 'उत्पाद लोड करनें में विफल',
    totalLabel: 'कुल',
    perAcre: 'प्रति एकड़',
    addWishlist: 'विशलिस्ट में सहेजें',
    inWishlist: 'विशलिस्ट में',
    addCart: 'बकेट में डालें',
    inCart: 'बकेट में',
    membershipRequired: 'मेंबरशिप आवश्यक',
    membershipBody: 'विक्रेता का मोबाइल नंबर और ईमेल केवल पेड मेंबर्स के साथ साझा किया जाता है। इससे विक्रेता स्पैम से सुरक्षित रहते हैं और हर पूछताछ असली खरीदार से आती है। असीमित विक्रेता संपर्क के लिए प्लान चुनें।',
    viewMembership: 'मेंबरशिप प्लान देखें',
    videoLabel: 'उत्पाद वीडियो',
    zoomHint: 'ज़ूम के लिए क्लिक करें',
    interestLoginTitle: 'इस उत्पाद को सहेजने के लिए लॉग इन करें',
    interestLoginBody: 'आपकी विशलिस्ट और खरीद बकेट आपके खाते में सहेजी जाती है ताकि किसी भी डिवाइस पर मिल सके। इस्तेमाल करने के लिए लॉग इन करें या मुफ़्त पंजीकरण करें।',
    interestFailed: 'सूची अपडेट नहीं हो सकी। कृपया पुनः प्रयास करें।',
    addedWishlist: 'विशलिस्ट में सहेजा गया',
    addedCart: 'खरीद बकेट में जोड़ा गया',
    removedWishlist: 'विशलिस्ट से हटाया गया',
    removedCart: 'खरीद बकेट से हटाया गया',
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
  // Which buckets this product already sits in for the logged-in buyer.
  const [interests, setInterests] = useState({ wishlist: false, cart: false })
  const [interestBusy, setInterestBusy] = useState('')
  // Small inline notice under the wishlist/bucket buttons (login prompt,
  // success confirmation, or failure). Auto-clears for success messages.
  const [interestNotice, setInterestNotice] = useState(null)
  // Zoom lightbox state for the image gallery.
  const [lightbox, setLightbox] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%')
  const noticeTimer = useRef(null)

  const showNotice = useCallback((notice, autoHideMs) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    setInterestNotice(notice)
    if (autoHideMs) noticeTimer.current = setTimeout(() => setInterestNotice(null), autoHideMs)
  }, [])

  useEffect(() => {
    if (params?.id) loadProduct()
  }, [params?.id])

  // Load the buyer's existing wishlist/cart membership for this product so
  // the buttons render in their active state on repeat visits.
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token || !params?.id) return
    api.getInterests(null, token)
      .then((res) => {
        const mine = (res?.items || []).filter((i) => i.product?.id === params.id)
        setInterests({
          wishlist: mine.some((i) => i.type === 'wishlist'),
          cart: mine.some((i) => i.type === 'cart'),
        })
      })
      .catch(() => {})
  }, [params?.id])

  const loginHref = `/login?next=${encodeURIComponent(`/marketplace/${params?.id}`)}`

  const toggleInterest = async (type) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token) {
      showNotice({ kind: 'login' })
      return
    }
    setInterestBusy(type)
    try {
      if (interests[type]) {
        await api.removeInterest(params.id, type, token)
        setInterests((s) => ({ ...s, [type]: false }))
        showNotice({ kind: 'ok', msg: type === 'wishlist' ? text.removedWishlist : text.removedCart }, 2500)
      } else {
        await api.addInterest(params.id, type, token)
        setInterests((s) => ({ ...s, [type]: true }))
        showNotice({ kind: 'ok', msg: type === 'wishlist' ? text.addedWishlist : text.addedCart }, 2500)
      }
      notifyInterestsChanged()
    } catch (err) {
      if (err?.status === 401) {
        setInterests({ wishlist: false, cart: false })
        showNotice({ kind: 'login', expired: true })
      } else {
        showNotice({ kind: 'error', msg: err?.message || text.interestFailed }, 4000)
      }
    } finally { setInterestBusy('') }
  }

  // Keyboard navigation for the lightbox.
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => {
      if (e.key === 'Escape') { setLightbox(false); setZoomed(false) }
      if (e.key === 'ArrowRight') setActiveImage((i) => (i + 1) % Math.max(productImages(product || {}).length, 1))
      if (e.key === 'ArrowLeft') setActiveImage((i) => (i - 1 + Math.max(productImages(product || {}).length, 1)) % Math.max(productImages(product || {}).length, 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, product])

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
      const msg = err?.message || text.contactError
      if (err?.status === 401) {
        // Token expired / revoked — api.js already cleared it.
        setContactModal({ needLogin: true, expired: true })
      } else if (err?.status === 403 || err?.code === 'MEMBERSHIP_REQUIRED' || /membership/i.test(msg)) {
        setContactModal({ needMembership: true })
      } else {
        setContactModal({ error: msg })
      }
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
              <div
                className={`group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100 ${images.length > 0 ? 'cursor-zoom-in' : ''}`}
                onClick={() => images.length > 0 && setLightbox(true)}
                onMouseMove={(e) => {
                  // Hover magnifier: shift transform-origin to the pointer so
                  // the 1.6x scaled image reveals the area under the cursor.
                  const r = e.currentTarget.getBoundingClientRect()
                  setZoomOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
                }}
              >
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[activeImage] || images[0]}
                      alt={product.titleHi && lang === 'hi' ? product.titleHi : product.title}
                      className='h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.6]'
                      style={{ transformOrigin: zoomOrigin }}
                    />
                    <span className='pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100'>
                      <ZoomIn className='h-3.5 w-3.5' /> {text.zoomHint}
                    </span>
                  </>
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
            {product.videoUrl && (
              <div className='rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
                <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>{text.videoLabel}</p>
                <video
                  controls
                  preload='metadata'
                  className='w-full rounded-xl bg-black'
                  src={`${BACKEND_URL}${product.videoUrl}`}
                />
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
              <h1 className='mt-3 text-2xl font-bold text-gray-900'>{displayTitle(product, lang)}</h1>
              {product.description && (
                <p className='mt-3 text-sm text-gray-600'>{product.description}</p>
              )}

              {(() => {
                const perAcre = landRatePerAcre(product)
                if (perAcre) {
                  // Land is priced per acre — headline the rate, keep the
                  // total asking price visible as secondary context.
                  return (
                    <div className='mt-4'>
                      <div className='flex items-baseline gap-1'>
                        <span className='text-3xl font-extrabold text-emerald-700'>₹{perAcre.toLocaleString('en-IN')}</span>
                        <span className='text-sm font-normal text-gray-500'>{text.perAcre}</span>
                      </div>
                      <p className='mt-1 text-sm text-gray-500'>{text.totalLabel}: ₹{Number(product.price).toLocaleString('en-IN')}</p>
                    </div>
                  )
                }
                return (
                  <div className='mt-4 flex items-baseline gap-1'>
                    <span className='text-3xl font-extrabold text-emerald-700'>₹{product.price}</span>
                    {product.priceUnit && (
                      <span className='text-sm font-normal text-gray-500'>/ {unitLabel(product.priceUnit, lang)}</span>
                    )}
                  </div>
                )
              })()}

              {product.quantity && (
                <p className='mt-2 text-sm text-gray-600'>
                  Available: <span className='font-semibold'>{product.quantity} {unitLabel(product.quantityUnit, lang)}</span>
                </p>
              )}

              <div className='mt-4 space-y-2 text-sm text-gray-600'>
                <p className='flex items-center gap-2'>
                  <MapPin className='h-4 w-4 text-emerald-600' />
                  {product.location || [product.district, product.state].filter(Boolean).join(', ') || 'Location not set'}
                </p>
                {/* Seller contact is never public — members reveal it via Contact Seller. */}
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

              {/* Wishlist + buying bucket — saved per buyer so their interests
                  are waiting for them on the next visit (see /my-interests). */}
              <div className='mt-3 flex gap-3'>
                <button
                  onClick={() => toggleInterest('wishlist')}
                  disabled={interestBusy === 'wishlist'}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    interests.wishlist
                      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:text-rose-600'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${interests.wishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {interests.wishlist ? text.inWishlist : text.addWishlist}
                </button>
                <button
                  onClick={() => toggleInterest('cart')}
                  disabled={interestBusy === 'cart'}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    interests.cart
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:text-emerald-600'
                  }`}
                >
                  <ShoppingCart className={`h-4 w-4 ${interests.cart ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                  {interests.cart ? text.inCart : text.addCart}
                </button>
              </div>

              {interestNotice?.kind === 'login' && (
                <div className='mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4'>
                  <div className='flex items-start gap-3'>
                    <LogIn className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
                    <div className='flex-1'>
                      <p className='text-sm font-semibold text-amber-900'>
                        {interestNotice.expired ? text.sessionExpiredTitle : text.interestLoginTitle}
                      </p>
                      <p className='mt-1 text-xs text-amber-800'>
                        {interestNotice.expired ? text.sessionExpiredBody : text.interestLoginBody}
                      </p>
                      <div className='mt-3 flex flex-wrap gap-2'>
                        <Link href={loginHref} className='rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700'>{text.login}</Link>
                        <Link href={`/register?next=${encodeURIComponent(`/marketplace/${params.id}`)}`} className='rounded-lg border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50'>{text.register}</Link>
                      </div>
                    </div>
                    <button onClick={() => setInterestNotice(null)} className='text-amber-400 hover:text-amber-600'><X className='h-4 w-4' /></button>
                  </div>
                </div>
              )}
              {interestNotice?.kind === 'ok' && (
                <p className='mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700'>
                  <CheckCircle className='h-4 w-4' /> {interestNotice.msg}
                </p>
              )}
              {interestNotice?.kind === 'error' && (
                <p className='mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700'>{interestNotice.msg}</p>
              )}
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
                <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100'>
                  <LogIn className='h-6 w-6 text-emerald-600' />
                </div>
                <h3 className='text-base font-bold text-gray-900'>
                  {contactModal.expired ? text.sessionExpiredTitle : text.loginRequiredTitle}
                </h3>
                <p className='mt-2 text-sm text-gray-600'>
                  {contactModal.expired ? text.sessionExpiredBody : text.loginRequiredBody}
                </p>
                <div className='mt-4 flex justify-center gap-2'>
                  <Link href={loginHref} className='rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'>
                    {text.login}
                  </Link>
                  {!contactModal.expired && (
                    <Link href={`/register?next=${encodeURIComponent(`/marketplace/${params.id}`)}`} className='rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100'>
                      {text.register}
                    </Link>
                  )}
                </div>
              </div>
            ) : contactModal.needMembership ? (
              <div className='text-center'>
                <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100'>
                  <Shield className='h-6 w-6 text-amber-600' />
                </div>
                <h3 className='text-base font-bold text-gray-900'>{text.membershipRequired}</h3>
                <p className='mt-2 text-sm text-gray-600'>{text.membershipBody}</p>
                <Link
                  href='/membership'
                  className='mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
                >
                  {text.viewMembership}
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

      {/* Image zoom lightbox */}
      {lightbox && images.length > 0 && (
        <div
          className='fixed inset-0 z-[60] flex items-center justify-center bg-black/90'
          onClick={() => { setLightbox(false); setZoomed(false) }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(false); setZoomed(false) }}
            className='absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20'
            aria-label='Close'
          >
            <X className='h-6 w-6' />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomed(false); setActiveImage((i) => (i - 1 + images.length) % images.length) }}
                className='absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20'
                aria-label='Previous image'
              >
                <ChevronLeft className='h-7 w-7' />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomed(false); setActiveImage((i) => (i + 1) % images.length) }}
                className='absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20'
                aria-label='Next image'
              >
                <ChevronRight className='h-7 w-7' />
              </button>
            </>
          )}
          <div
            className={`h-[90vh] w-[92vw] overflow-auto ${zoomed ? 'cursor-zoom-out' : 'flex items-center justify-center cursor-zoom-in'}`}
            onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z) }}
          >
            <img
              src={images[activeImage] || images[0]}
              alt={product.title}
              className='select-none'
              style={zoomed
                ? { width: '200%', maxWidth: 'none', height: 'auto' }
                : { maxHeight: '90vh', maxWidth: '92vw', objectFit: 'contain' }}
              draggable={false}
            />
          </div>
          <span className='absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white'>
            {activeImage + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  )
}
