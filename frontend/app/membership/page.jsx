'use client'

import { useState, useEffect } from 'react'
import { Check, Crown, Star, Zap, Award, X, Lock } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { api } from '../../lib/api'

export default function MembershipPage() {
  const [plans, setPlans] = useState([])
  const [myStatus, setMyStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
        const [plansRes, statusRes] = await Promise.all([
          api.getMembershipPlans(),
          token ? api.getMyMembershipStatus(token).catch(() => null) : Promise.resolve(null),
        ])
        setPlans(plansRes)
        setMyStatus(statusRes)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSubscribe(planCode) {
    setSubscribing(true)
    setError(null)
    setMessage(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('kp_token') : null
      if (!token) {
        setError('Please login first to subscribe')
        return
      }
      await api.subscribeMembership(planCode, token)
      setMessage('Subscription activated! You now have unlimited listings and contacts for 90 days.')
      const statusRes = await api.getMyMembershipStatus(token)
      setMyStatus(statusRes)
    } catch (err) {
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
          <Header />
          <main className='flex-1 flex items-center justify-center'>
            <p className='text-gray-400'>Loading plans...</p>
          </main>
        </div>
      </div>
    )
  }

  const isPaid = myStatus?.isPaid

  return (
    <div className='min-h-screen bg-gray-50 flex'>
      <Sidebar />
      <div className='flex-1 min-w-0 flex flex-col'>
        <Header />
        <main className='flex-1 p-4 md:p-6'>
          <div className='mx-auto max-w-5xl space-y-8'>
            <div className='text-center'>
              <h1 className='text-3xl font-bold text-gray-900'>Membership Plans</h1>
              <p className='mt-2 text-sm text-gray-500'>Choose the right plan to grow your business</p>
            </div>

            {/* Current status */}
            {myStatus && (
              <div className={`rounded-2xl p-6 text-center ${isPaid ? 'bg-amber-50' : 'bg-gray-50'}`}>
                <Award className={`mx-auto mb-2 h-8 w-8 ${isPaid ? 'text-amber-500' : 'text-gray-400'}`} />
                <h3 className='text-lg font-bold text-gray-900'>
                  {isPaid ? 'Paid Member' : 'Free Plan'}
                </h3>
                {isPaid ? (
                  <p className='mt-1 text-sm text-gray-600'>
                    Active until {myStatus.subscription?.endDate ? new Date(myStatus.subscription.endDate).toLocaleDateString('en-IN') : '—'}
                  </p>
                ) : (
                  <p className='mt-1 text-sm text-gray-600'>
                    Listings used: {myStatus.freeListingsUsed} / {myStatus.freeLimit} · Contacts used: {myStatus.freeContactsUsed} / {myStatus.freeLimit}
                  </p>
                )}
              </div>
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
                        Recommended
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
                        {plan.billingCycle === 'quarterly' ? ' / 3 months' : plan.billingCycle === 'yearly' ? ' / year' : ''}
                      </span>
                    </p>
                    <ul className='mt-6 space-y-3'>
                      <li className='flex items-center gap-2 text-sm'>
                        <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                        <span className='text-gray-700'>
                          {plan.code === 'free'
                            ? `Up to ${plan.freeListingLimit} product listings (lifetime)`
                            : 'Unlimited product listings'}
                        </span>
                      </li>
                      <li className='flex items-center gap-2 text-sm'>
                        <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                        <span className='text-gray-700'>
                          {plan.code === 'free'
                            ? `Up to ${plan.freeListingLimit} seller contacts (lifetime)`
                            : 'Unlimited seller contacts'}
                        </span>
                      </li>
                      <li className='flex items-center gap-2 text-sm'>
                        <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                        <span className='text-gray-700'>View mandi rates & weather</span>
                      </li>
                      {plan.code !== 'free' && (
                        <>
                          <li className='flex items-center gap-2 text-sm'>
                            <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                            <span className='text-gray-700'>Priority listing placement</span>
                          </li>
                          <li className='flex items-center gap-2 text-sm'>
                            <Check className='h-4 w-4 flex-shrink-0 text-emerald-600' />
                            <span className='text-gray-700'>Advanced analytics</span>
                          </li>
                        </>
                      )}
                      {plan.code === 'free' && (
                        <li className='flex items-center gap-2 text-sm'>
                          <X className='h-4 w-4 flex-shrink-0 text-gray-300' />
                          <span className='text-gray-400'>Priority listing</span>
                        </li>
                      )}
                    </ul>
                    <button
                      disabled={isCurrent || subscribing}
                      onClick={() => plan.code !== 'free' && handleSubscribe(plan.code)}
                      className={`mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition ${c.btn} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isCurrent ? 'Current Plan' : plan.price === '0' ? 'Free Forever' : `Upgrade to ${plan.name}`}
                    </button>
                  </div>
                )
              })}
            </div>

            {message && (
              <div className='rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700'>{message}</div>
            )}
            {error && (
              <div className='rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700'>{error}</div>
            )}

            <div className='rounded-2xl bg-blue-50 p-4 text-center text-xs text-blue-600'>
              <Lock className='mx-auto mb-1 h-4 w-4' />
              Payment gateway integration (Razorpay/Stripe) coming soon. Subscriptions are activated immediately for testing.
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
