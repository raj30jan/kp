'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Crown, Star, Zap, Award, X, Lock, QrCode, Clock, Receipt, CheckCircle2, XCircle, Hourglass, Copy, Smartphone } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { api, API_BASE } from '../../lib/api'
import { useLang } from '../../lib/lang-context'

const BACKEND_URL = API_BASE.replace(/\/api\/v1$/, '')

const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const t = {
  en: {
    title: 'Membership Plans',
    sub: 'Choose the right plan to grow your business',
    loading: 'Loading plans...',
    paidMember: 'Paid Member',
    freePlan: 'Free Plan',
    activeUntil: 'Active until',
    listingsUsed: 'Listings used',
    contactsUsed: 'Contacts used',
    pendingTitle: 'Payment under verification',
    pendingBody: (s) => `Your ${s?.planName || s?.planCode} membership payment (UTR: ${s?.paymentReference}) is being verified by our team. It will activate automatically once confirmed.`,
    payFor: (name) => `Pay for ${name}`,
    payInstructions: (price) => `Scan the QR with any UPI app (GPay / PhonePe / Paytm) and pay ₹${price}, then enter the transaction reference below.`,
    qrMissing: 'QR not uploaded yet — use the UPI ID',
    utrLabel: 'UPI Transaction / UTR Number *',
    utrHint: 'Find it in your payment app under the transaction details.',
    utrError: 'Please enter the UPI transaction / UTR number from your payment app',
    loginFirst: 'Please login first to subscribe',
    submitPay: 'Submit Payment for Verification',
    submitting: 'Submitting…',
    submitted: 'Payment submitted! Your membership will be activated after our team verifies the payment (usually within a few hours).',
    currentPlan: 'Current Plan',
    freeForever: 'Free Forever',
    payViaUpi: (price) => `Pay ₹${price} via UPI`,
    freeListings: (n) => `Up to ${n} product listings (lifetime)`,
    freeContacts: (n) => `Up to ${n} seller contacts (lifetime)`,
    unlimitedListings: 'Unlimited product listings',
    unlimitedContacts: 'Unlimited seller contacts',
    mandiWeather: 'View mandi rates & weather',
    priorityListing: 'Priority listing placement',
    analytics: 'Advanced analytics',
    priorityNo: 'Priority listing',
    recommended: 'Recommended',
    per3mo: ' / 3 months',
    perYear: ' / year',
    footnote: 'Payments are verified manually by our team against your UPI reference. Membership activates within a few hours of verification.',
    validFor: (d) => `Valid for ${d} days from activation`,
    stepScan: 'Scan & pay',
    stepUtr: 'Enter UTR',
    stepVerify: 'We verify & activate',
    paidNote: 'Already paid? This window cannot detect your UPI payment — enter the UTR / transaction reference below and press Submit.',
    payInApp: (price) => `Pay ₹${price} in UPI app`,
    copy: 'Copy',
    copied: 'Copied',
    history: 'Payment History',
    historySub: 'Every payment you have submitted and its verification outcome.',
    hDate: 'Submitted',
    hPlan: 'Plan',
    hAmount: 'Amount',
    hUtr: 'UTR',
    hStatus: 'Status',
    hPeriod: 'Membership Period',
    stSuccess: 'Success',
    stFailed: 'Failed',
    stPending: 'Pending',
    verifiedOn: 'Verified',
    noHistory: 'No payments yet.',
    cancel: 'Cancel',
  },
  hi: {
    title: 'मेंबरशिप प्लान',
    sub: 'अपना व्यापार बढ़ाने के लिए सही प्लान चुनें',
    loading: 'प्लान लोड हो रहे हैं...',
    paidMember: 'पेड मेंबर',
    freePlan: 'फ्री प्लान',
    activeUntil: 'इस तारीख तक सक्रिय',
    listingsUsed: 'उपयोग की गई लिस्टिंग',
    contactsUsed: 'उपयोग किए गए संपर्क',
    pendingTitle: 'भुगतान सत्यापन में',
    pendingBody: (s) => `आपका ${s?.planName || s?.planCode} मेंबरशिप भुगतान (UTR: ${s?.paymentReference}) हमारी टीम द्वारा सत्यापित किया जा रहा है। पुष्टि होते ही यह अपने आप सक्रिय हो जाएगा।`,
    payFor: (name) => `${name} के लिए भुगतान करें`,
    payInstructions: (price) => `किसी भी UPI ऐप (GPay / PhonePe / Paytm) से QR स्कैन करके ₹${price} का भुगतान करें, फिर नीचे ट्रांज़ेक्शन रेफ़रेंस दर्ज करें।`,
    qrMissing: 'QR अभी अपलोड नहीं हुआ — UPI ID का उपयोग करें',
    utrLabel: 'UPI ट्रांज़ेक्शन / UTR नंबर *',
    utrHint: 'यह आपके पेमेंट ऐप में ट्रांज़ेक्शन विवरण में मिलता है।',
    utrError: 'कृपया अपने पेमेंट ऐप से UPI ट्रांज़ेक्शन / UTR नंबर दर्ज करें',
    loginFirst: 'सब्सक्राइब करने के लिए पहले लॉग इन करें',
    submitPay: 'सत्यापन के लिए भुगतान जमा करें',
    submitting: 'जमा हो रहा है…',
    submitted: 'भुगतान जमा हुआ! हमारी टीम भुगतान सत्यापित करने के बाद आपकी मेंबरशिप सक्रिय हो जाएगी (आमतौर पर कुछ घंटों में)।',
    currentPlan: 'वर्तमान प्लान',
    freeForever: 'हमेशा के लिए फ्री',
    payViaUpi: (price) => `UPI से ₹${price} भुगतान करें`,
    freeListings: (n) => `${n} तक उत्पाद लिस्टिंग (लाइफ़टाइम)`,
    freeContacts: (n) => `${n} तक विक्रेता संपर्क (लाइफ़टाइम)`,
    unlimitedListings: 'असीमित उत्पाद लिस्टिंग',
    unlimitedContacts: 'असीमित विक्रेता संपर्क',
    mandiWeather: 'मंडी भाव और मौसम देखें',
    priorityListing: 'प्राथमिकता लिस्टिंग प्लेसमेंट',
    analytics: 'एडवांस्ड एनालिटिक्स',
    priorityNo: 'प्राथमिकता लिस्टिंग',
    recommended: 'अनुशंसित',
    per3mo: ' / 3 महीने',
    perYear: ' / वर्ष',
    footnote: 'भुगतान आपके UPI रेफ़रेंस के आधार पर हमारी टीम द्वारा मैन्युअल रूप से सत्यापित किया जाता है। सत्यापन के कुछ घंटों में मेंबरशिप सक्रिय हो जाती है।',
    validFor: (d) => `सक्रिय होने से ${d} दिन तक मान्य`,
    stepScan: 'स्कैन कर भुगतान करें',
    stepUtr: 'UTR दर्ज करें',
    stepVerify: 'हम सत्यापित कर सक्रिय करेंगे',
    paidNote: 'भुगतान कर दिया? यह विंडो आपका UPI भुगतान अपने आप नहीं पहचान सकती — नीचे UTR / ट्रांज़ेक्शन रेफ़रेंस दर्ज करके Submit दबाएँ।',
    payInApp: (price) => `UPI ऐप में ₹${price} भुगतान करें`,
    copy: 'कॉपी',
    copied: 'कॉपी हो गया',
    history: 'भुगतान इतिहास',
    historySub: 'आपके द्वारा जमा किये गये सभी भुगतान और उनका सत्यापन परिणाम।',
    hDate: 'जमा तिथि',
    hPlan: 'प्लान',
    hAmount: 'राशि',
    hUtr: 'UTR',
    hStatus: 'स्थिति',
    hPeriod: 'मेंबरशिप अवधि',
    stSuccess: 'सफल',
    stFailed: 'असफल',
    stPending: 'लंबित',
    verifiedOn: 'सत्यापित',
    noHistory: 'अभी कोई भुगतान नहीं।',
    cancel: 'रद्द करें',
  },
}

export default function MembershipPage() {
  const { lang } = useLang()
  const router = useRouter()
  const text = t[lang] || t.en
  const [plans, setPlans] = useState([])
  const [myStatus, setMyStatus] = useState(null)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  // Which paid plan the user is paying for right now + their UPI reference.
  const [payingPlan, setPayingPlan] = useState(null)
  const [utr, setUtr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
        const [plansRes, statusRes, payRes] = await Promise.all([
          api.getMembershipPlans(),
          token ? api.getMyMembershipStatus(token).catch(() => null) : Promise.resolve(null),
          api.getMembershipPaymentInfo().catch(() => null),
        ])
        setPlans(plansRes)
        setMyStatus(statusRes)
        setPaymentInfo(payRes)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Lock body scroll while the payment modal is open.
  useEffect(() => {
    if (!payingPlan) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') closePayment() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [payingPlan])

  function closePayment() {
    setPayingPlan(null)
    setUtr('')
    setError(null)
    setCopied(false)
  }

  function copyUpiId() {
    if (!paymentInfo?.upiId || typeof navigator === 'undefined') return
    navigator.clipboard?.writeText(paymentInfo.upiId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  // upi:// deep link opens GPay/PhonePe/Paytm on mobile with payee + amount prefilled.
  function upiDeepLink(plan) {
    if (!paymentInfo?.upiId) return null
    const params = new URLSearchParams({
      pa: paymentInfo.upiId,
      pn: paymentInfo.payeeName || 'KisanPatrika',
      am: String(Number(plan.price)),
      cu: 'INR',
      tn: `KisanPatrika ${plan.name} membership`,
    })
    return `upi://pay?${params.toString()}`
  }

  function startPayment(plan) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
    if (!token) {
      router.push(`/login?next=${encodeURIComponent('/membership')}`)
      return
    }
    setError(null)
    setMessage(null)
    setPayingPlan(plan)
  }

  async function handleSubscribe() {
    if (!payingPlan) return
    if (!utr.trim() || utr.trim().length < 6) {
      setError(text.utrError)
      return
    }
    setSubscribing(true)
    setError(null)
    setMessage(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
      if (!token) {
        router.push(`/login?next=${encodeURIComponent('/membership')}`)
        return
      }
      await api.subscribeMembership(payingPlan.code, token, utr.trim())
      setMessage(text.submitted)
      setPayingPlan(null)
      setUtr('')
      const statusRes = await api.getMyMembershipStatus(token)
      setMyStatus(statusRes)
    } catch (err) {
      if (err?.status === 401) {
        router.push(`/login?next=${encodeURIComponent('/membership')}`)
        return
      }
      setError(err.message)
    } finally {
      setSubscribing(false)
    }
  }

  const planIconMap = { free: Star, quarterly: Zap, gold: Crown }
  const planColorMap = {
    free: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'ring-gray-200', btn: 'bg-gray-600 hover:bg-gray-700' },
    quarterly: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'ring-amber-200', btn: 'bg-amber-500 hover:bg-amber-600' },
    gold: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'ring-blue-200', btn: 'bg-blue-600 hover:bg-blue-700' },
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex'>
        <Sidebar />
        <div className='flex-1 min-w-0 flex flex-col'>
          <main className='flex-1 flex items-center justify-center'>
            <p className='text-gray-400'>{text.loading}</p>
          </main>
        </div>
      </div>
    )
  }

  const isPaid = myStatus?.isPaid
  const pendingSub = myStatus?.pendingSubscription
  const payments = myStatus?.payments || []
  const qrSrc = paymentInfo?.qrUrl
    ? (paymentInfo.qrUrl.startsWith('http') ? paymentInfo.qrUrl : `${BACKEND_URL}${paymentInfo.qrUrl}`)
    : null
  const statusMeta = {
    verified: { label: text.stSuccess, cls: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
    rejected: { label: text.stFailed, cls: 'bg-red-50 text-red-700', Icon: XCircle },
    pending: { label: text.stPending, cls: 'bg-amber-50 text-amber-700', Icon: Hourglass },
  }

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <Sidebar />
      <div className='flex-1 min-w-0 flex flex-col'>
        <main className='flex-1 p-4 md:p-6'>
          <div className='mx-auto max-w-5xl space-y-8'>
            <div className='text-center'>
              <h1 className='text-3xl font-bold text-gray-900'>{text.title}</h1>
              <p className='mt-2 text-sm text-gray-500'>{text.sub}</p>
            </div>

            {/* Current status */}
            {myStatus && (
              <div className={`rounded-2xl p-6 text-center ${isPaid ? 'bg-amber-50' : 'bg-gray-50'}`}>
                <Award className={`mx-auto mb-2 h-8 w-8 ${isPaid ? 'text-amber-500' : 'text-gray-400'}`} />
                <h3 className='text-lg font-bold text-gray-900'>
                  {isPaid ? text.paidMember : text.freePlan}
                </h3>
                {isPaid ? (
                  <p className='mt-1 text-sm text-gray-600'>
                    {myStatus.subscription?.planName ? `${myStatus.subscription.planName} · ` : ''}
                    {text.activeUntil} <span className='font-semibold text-gray-800'>{myStatus.subscription?.endDate ? fmtDateTime(myStatus.subscription.endDate) : '—'}</span>
                  </p>
                ) : (
                  <p className='mt-1 text-sm text-gray-600'>
                    {text.listingsUsed}: {myStatus.freeListingsUsed} / {myStatus.freeLimit} · {text.contactsUsed}: {myStatus.freeContactsUsed} / {myStatus.freeLimit}
                  </p>
                )}
              </div>
            )}

            {/* Pending payment verification */}
            {pendingSub && (
              <div className='flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5'>
                <Clock className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
                <div>
                  <h3 className='text-sm font-bold text-amber-800'>{text.pendingTitle}</h3>
                  <p className='mt-1 text-sm text-amber-700'>
                    {text.pendingBody(pendingSub)}
                  </p>
                </div>
              </div>
            )}

            {message && (
              <div className='rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700'>{message}</div>
            )}
            {error && !payingPlan && (
              <div className='rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700'>{error}</div>
            )}

            {/* Plans */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {plans.map((plan) => {
                const Icon = planIconMap[plan.code] || Star
                const c = planColorMap[plan.code] || planColorMap.free
                const isCurrent = isPaid ? plan.code !== 'free' : plan.code === 'free'
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl bg-white p-6 shadow-sm ring-1 ${plan.code === 'quarterly' ? 'ring-2 ring-amber-300' : c.border}`}
                  >
                    {plan.code === 'quarterly' && (
                      <span className='absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white'>
                        {text.recommended}
                      </span>
                    )}
                    <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${c.bg}`}>
                      <Icon className={`h-7 w-7 ${c.text}`} />
                    </div>
                    <h3 className='text-center text-xl font-bold text-gray-900'>{plan.name}</h3>
                    <p className='mt-3 text-center'>
                      <span className='text-3xl font-extrabold text-gray-900'>
                        ₹{Number(plan.price).toLocaleString('en-IN')}
                      </span>
                      <span className='text-sm text-gray-500'>
                        {plan.billingCycle === 'quarterly' ? text.per3mo : plan.billingCycle === 'yearly' ? text.perYear : ''}
                      </span>
                    </p>
                    <ul className='mt-6 space-y-3'>
                      <li className='flex items-center gap-2 text-sm'>
                        <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                        <span className='text-gray-700'>
                          {plan.code === 'free'
                            ? text.freeListings(plan.freeListingLimit)
                            : text.unlimitedListings}
                        </span>
                      </li>
                      <li className='flex items-center gap-2 text-sm'>
                        <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                        <span className='text-gray-700'>
                          {plan.code === 'free'
                            ? text.freeContacts(plan.freeListingLimit)
                            : text.unlimitedContacts}
                        </span>
                      </li>
                      <li className='flex items-center gap-2 text-sm'>
                        <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                        <span className='text-gray-700'>{text.mandiWeather}</span>
                      </li>
                      {plan.code !== 'free' && (
                        <>
                          <li className='flex items-center gap-2 text-sm'>
                            <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                            <span className='text-gray-700'>{text.priorityListing}</span>
                          </li>
                          <li className='flex items-center gap-2 text-sm'>
                            <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                            <span className='text-gray-700'>{text.analytics}</span>
                          </li>
                        </>
                      )}
                      {plan.code === 'free' && (
                        <li className='flex items-center gap-2 text-sm'>
                          <X className='h-4 w-4 flex-shrink-0 text-gray-300' />
                          <span className='text-gray-400'>{text.priorityNo}</span>
                        </li>
                      )}
                    </ul>
                    {plan.code !== 'free' && plan.durationDays && (
                      <p className='mt-4 text-center text-xs text-gray-500'>{text.validFor(plan.durationDays)}</p>
                    )}
                    <button
                      disabled={isCurrent || subscribing || (!!pendingSub && plan.code !== 'free')}
                      onClick={() => plan.code !== 'free' && startPayment(plan)}
                      className={`mt-4 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition ${c.btn} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isCurrent ? text.currentPlan : Number(plan.price) === 0 ? text.freeForever : text.payViaUpi(Number(plan.price).toLocaleString('en-IN'))}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Payment history */}
            {myStatus && (
              <div className='rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
                <div className='flex items-center gap-3'>
                  <span className='rounded-xl bg-emerald-50 p-2 text-emerald-600'><Receipt className='h-5 w-5' /></span>
                  <div>
                    <h3 className='text-base font-bold text-gray-900'>{text.history}</h3>
                    <p className='text-xs text-gray-500'>{text.historySub}</p>
                  </div>
                </div>
                {payments.length === 0 ? (
                  <p className='mt-4 text-center text-sm text-gray-400'>{text.noHistory}</p>
                ) : (
                  <div className='mt-4 overflow-x-auto'>
                    <table className='min-w-full text-sm'>
                      <thead>
                        <tr className='text-left text-xs uppercase tracking-wide text-gray-400'>
                          <th className='py-2 pr-4 font-semibold'>{text.hDate}</th>
                          <th className='py-2 pr-4 font-semibold'>{text.hPlan}</th>
                          <th className='py-2 pr-4 font-semibold'>{text.hAmount}</th>
                          <th className='py-2 pr-4 font-semibold'>{text.hUtr}</th>
                          <th className='py-2 pr-4 font-semibold'>{text.hStatus}</th>
                          <th className='py-2 font-semibold'>{text.hPeriod}</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-gray-50'>
                        {payments.map((p) => {
                          const m = statusMeta[p.status] || statusMeta.pending
                          return (
                            <tr key={p.id}>
                              <td className='py-3 pr-4 text-xs text-gray-600 whitespace-nowrap'>{fmtDateTime(p.createdAt)}</td>
                              <td className='py-3 pr-4 text-gray-800'>{p.planName || p.planCode}</td>
                              <td className='py-3 pr-4 font-semibold text-gray-900'>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                              <td className='py-3 pr-4 font-mono text-xs text-gray-600'>{p.paymentReference || '—'}</td>
                              <td className='py-3 pr-4'>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${m.cls}`}>
                                  <m.Icon className='h-3.5 w-3.5' /> {m.label}
                                </span>
                                {p.verifiedAt && (
                                  <div className='mt-1 text-[11px] text-gray-400'>{text.verifiedOn}: {fmtDateTime(p.verifiedAt)}</div>
                                )}
                                {p.status === 'rejected' && p.remarks && (
                                  <div className='mt-1 max-w-[200px] text-[11px] text-red-500'>{p.remarks}</div>
                                )}
                              </td>
                              <td className='py-3 text-xs text-gray-600 whitespace-nowrap'>
                                {p.startDate ? (
                                  <>
                                    <div>{fmtDateTime(p.startDate)}</div>
                                    <div className='text-gray-400'>→ {p.endDate ? fmtDateTime(p.endDate) : '—'}</div>
                                  </>
                                ) : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className='rounded-2xl bg-blue-50 p-4 text-center text-xs text-blue-600'>
              <Lock className='mx-auto mb-1 h-4 w-4' />
              {text.footnote}
            </div>
          </div>
        </main>
      </div>

      {/* Payment modal — QR + UTR entry for the selected paid plan */}
      {payingPlan && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4' onClick={closePayment}>
          <div
            className='w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
            role='dialog'
            aria-modal='true'
          >
            <div className='flex items-start justify-between'>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>{text.payFor(payingPlan.name)}</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  {text.payInstructions(Number(payingPlan.price).toLocaleString('en-IN'))}
                </p>
              </div>
              <button onClick={closePayment} className='text-gray-400 hover:text-gray-600' aria-label='Close'>
                <X className='h-5 w-5' />
              </button>
            </div>

            <ol className='mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-gray-500'>
              {[text.stepScan, text.stepUtr, text.stepVerify].map((s, i) => (
                <li key={s} className='rounded-lg bg-gray-50 px-2 py-1.5'>
                  <span className='mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white'>{i + 1}</span>{s}
                </li>
              ))}
            </ol>

            <div className='mt-5 grid gap-6 sm:grid-cols-[auto_1fr]'>
              <div className='flex flex-col items-center'>
                {qrSrc ? (
                  <img src={qrSrc} alt='Membership payment QR' className='h-52 w-52 rounded-xl border border-gray-200 object-contain' />
                ) : (
                  <div className='flex h-52 w-52 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400'>
                    <QrCode className='h-10 w-10' />
                    <span className='mt-2 px-3 text-center text-xs'>{text.qrMissing}</span>
                  </div>
                )}
                {paymentInfo?.upiId && (
                  <button
                    type='button'
                    onClick={copyUpiId}
                    className='mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-xs font-semibold text-gray-700 transition hover:bg-gray-200'
                    title={text.copy}
                  >
                    {paymentInfo.upiId}
                    {copied ? <Check className='h-3.5 w-3.5 text-emerald-600' /> : <Copy className='h-3.5 w-3.5 text-gray-400' />}
                  </button>
                )}
                {copied && <p className='mt-1 text-[11px] font-medium text-emerald-600'>{text.copied}</p>}
                {paymentInfo?.payeeName && (
                  <p className='mt-1 text-xs text-gray-500'>{paymentInfo.payeeName}</p>
                )}
                <p className='mt-2 text-2xl font-extrabold text-gray-900'>₹{Number(payingPlan.price).toLocaleString('en-IN')}</p>
                {upiDeepLink(payingPlan) && (
                  <a
                    href={upiDeepLink(payingPlan)}
                    className='mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700'
                  >
                    <Smartphone className='h-4 w-4' />
                    {text.payInApp(Number(payingPlan.price).toLocaleString('en-IN'))}
                  </a>
                )}
              </div>
              <div className='flex flex-col justify-center'>
                <p className='mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium leading-relaxed text-amber-800 ring-1 ring-amber-200'>
                  {text.paidNote}
                </p>
                <label className='mb-1 block text-sm font-medium text-gray-700'>{text.utrLabel}</label>
                <input
                  type='text'
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubscribe() }}
                  maxLength={64}
                  autoFocus
                  placeholder='e.g. 412345678901'
                  className='w-full rounded-lg border border-gray-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                />
                <p className='mt-1 text-xs text-gray-500'>{text.utrHint}</p>
                {error && (
                  <p className='mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700'>{error}</p>
                )}
                <div className='mt-4 flex gap-2'>
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className='flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50'
                  >
                    {subscribing ? text.submitting : text.submitPay}
                  </button>
                  <button onClick={closePayment} className='rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50'>
                    {text.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
