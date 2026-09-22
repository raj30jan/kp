// Central API helper — all backend calls go through here.
// Base URL comes from NEXT_PUBLIC_API_URL (see .env.local); defaults to local NestJS.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

async function request(path, { method = 'GET', body, token, isFormData = false } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`
    const err = new Error(Array.isArray(message) ? message.join(', ') : message)
    err.status = res.status
    err.code = typeof data?.error === 'string' ? data.error : undefined
    // A 401 on an authenticated call means the stored JWT is expired or
    // revoked — drop it so the UI stops behaving as "logged in" and tell
    // listeners (Navbar etc.) to refresh their auth-dependent state.
    if (res.status === 401 && token && typeof window !== 'undefined') {
      localStorage.removeItem('kp_token')
      localStorage.removeItem('kp_mobile')
      window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { reason: 'expired' } }))
      err.sessionExpired = true
    }
    throw err
  }
  return data
}

/** Fired on window when the login state changes (login, logout, expiry). */
export const AUTH_CHANGED_EVENT = 'kp:auth-changed'
/** Fired on window after a wishlist / bucket add or remove so badges update instantly. */
export const INTERESTS_CHANGED_EVENT = 'kp:interests-changed'

export function notifyInterestsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(INTERESTS_CHANGED_EVENT))
}
export function notifyAuthChanged(reason = 'login') {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { reason } }))
}

export const api = {
  // Auth
  getCaptcha: () => request('/auth/captcha'),
  sendOtp: (mobile, email) => request('/auth/otp/send', { method: 'POST', body: { mobile, ...(email ? { email } : {}) } }),
  verifyOtp: (mobile, otp, email) => request('/auth/otp/verify', { method: 'POST', body: { mobile, otp, ...(email ? { email } : {}) } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (identifier, password) => request('/auth/login', { method: 'POST', body: { identifier, password } }),
  verifyLoginOtp: (challengeId, otp) => request('/auth/login/verify-otp', { method: 'POST', body: { challengeId, otp } }),
  resendLoginOtp: (challengeId) => request('/auth/login/resend-otp', { method: 'POST', body: { challengeId } }),
  getMe: (token) => request('/auth/me', { token }),
  guestLogin: (mobile, otp) => request('/auth/guest', { method: 'POST', body: { mobile, otp } }),

  // Location — cascading dropdowns
  getCountries: () => request('/location/countries'),
  getStates: (countryId) => request(`/location/states?countryId=${encodeURIComponent(countryId)}`),
  getDistricts: (stateId) => request(`/location/districts?stateId=${encodeURIComponent(stateId)}`),
  getCities: (districtId) => request(`/location/cities?districtId=${encodeURIComponent(districtId)}`),

  // Mandi — real daily prices proxied from data.gov.in / AGMARKNET
  getMandiRates: (params = {}) => {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&')
    return request(`/mandi/rates${qs ? `?${qs}` : ''}`)
  },

  // Service interest — records which service the visitor picked (support team follow-up)
  recordServiceInterest: ({ sessionId, serviceCode, serviceName, mobile, sourcePage, token }) =>
    request('/service-interest', {
      method: 'POST',
      token,
      body: { sessionId, serviceCode, serviceName, ...(mobile ? { mobile } : {}), ...(sourcePage ? { sourcePage } : {}) },
    }),

  // Marketplace / Buy-Sell
  getProducts: (params = {}, token) =>
    request('/marketplace/products?' + new URLSearchParams(params).toString(), { token }),
  // formData must be a browser FormData instance (fields + up to 5 "images" files)
  createProduct: (formData, token) =>
    request('/marketplace/products', { method: 'POST', token, body: formData, isFormData: true }),
  deleteProduct: (id, token) => request(`/marketplace/products/${id}`, { method: 'DELETE', token }),
  reactivateProduct: (id, token) => request(`/marketplace/products/${id}/reactivate`, { method: 'POST', token }),
  getProductCategories: () => request('/marketplace/products/categories'),
  getLargeLandParcels: (minAcres = 10) =>
    request(`/marketplace/products/land/large-parcels?minAcres=${encodeURIComponent(minAcres)}`),
  getCategoryTree: () => request('/marketplace/products/categories/tree'),
  getUnits: () => request('/marketplace/products/units'),
  getLocations: () => request('/marketplace/products/locations'),
  getProduct: (id) => request(`/marketplace/products/${id}`),
  getMyProducts: (params = {}, token) =>
    request('/marketplace/my-products?' + new URLSearchParams(params).toString(), { token }),
  contactSeller: (id, token) => request(`/marketplace/products/${id}/contact`, { method: 'POST', token }),
  getMyPurchases: (token) => request('/marketplace/my-purchases', { token }),

  // Buyer interests — wishlist (saved for later) + cart (buying bucket)
  getInterests: (type, token) =>
    request('/marketplace/interests' + (type ? `?type=${type}` : ''), { token }),
  addInterest: (productId, type, token) =>
    request('/marketplace/interests', { method: 'PUT', token, body: { productId, type } }),
  removeInterest: (productId, type, token) =>
    request(`/marketplace/interests?productId=${encodeURIComponent(productId)}&type=${type}`, { method: 'DELETE', token }),

  // Contact us (public — captcha required)
  submitContact: (body) => request('/contact', { method: 'POST', body }),

  // Services — hire labour, machinery, vets, patwari, loan agents, transport
  getServices: (params = {}) =>
    request('/services?' + new URLSearchParams(params).toString()),
  getService: (id) => request(`/services/${id}`),
  getServiceTypes: () => request('/services/types'),
  createService: (formData, token) =>
    request('/services', { method: 'POST', token, body: formData, isFormData: true }),
  getMyServices: (params = {}, token) =>
    request('/services/mine?' + new URLSearchParams(params).toString(), { token }),
  updateMyService: (id, body, token) =>
    request(`/services/mine/${id}`, { method: 'PATCH', token, body }),
  deleteService: (id, token) => request(`/services/${id}`, { method: 'DELETE', token }),
  reactivateService: (id, token) => request(`/services/${id}/reactivate`, { method: 'POST', token }),

  // Membership
  getMembershipPlans: () => request('/membership/plans'),
  getMembershipPaymentInfo: () => request('/membership/payment-info'),
  getMyMembershipStatus: (token) => request('/membership/my-status', { token }),
  subscribeMembership: (planCode, token, paymentReference) =>
    request('/membership/subscribe', { method: 'POST', token, body: { planCode, ...(paymentReference ? { paymentReference } : {}) } }),

  // My Farm — plots owned by the logged-in user
  getMyFarms: (token) => request('/farm/my-plots', { token }),
  createFarm: (body, token) => request('/farm/my-plots', { method: 'POST', token, body }),
  updateFarm: (id, body, token) => request(`/farm/my-plots/${id}`, { method: 'PATCH', token, body }),
  deleteFarm: (id, token) => request(`/farm/my-plots/${id}`, { method: 'DELETE', token }),

  // Activity — logged-in user's recent actions (dashboard timeline)
  getMyActivity: (limit = 20, token) => request(`/activity/my-activity?limit=${limit}`, { token }),

  // Complaints
  createComplaint: (body, token) => request('/complaints', { method: 'POST', token, body }),
  getMyComplaints: (token) => request('/complaints/my-complaints', { token }),
  // Admin
  getAllComplaints: (status, token) =>
    request('/complaints' + (status ? `?status=${status}` : ''), { token }),
  updateComplaintStatus: (id, body, token) =>
    request(`/complaints/${id}/status`, { method: 'PATCH', token, body }),

  // Admin — User Management (super admin)
  getAdminUsers: (params = {}, token) =>
    request('/admin/users?' + new URLSearchParams(params).toString(), { token }),
  getAdminUserStats: (token) => request('/admin/users/stats', { token }),
  getAdminUser: (id, token) => request(`/admin/users/${id}`, { token }),
  updateAdminUser: (id, body, token) => request(`/admin/users/${id}`, { method: 'PATCH', token, body }),
  promoteToAdmin: (id, token) => request(`/admin/users/${id}/promote-admin`, { method: 'POST', token }),
  demoteToUser: (id, token) => request(`/admin/users/${id}/demote-user`, { method: 'POST', token }),
}

export { API_BASE }
