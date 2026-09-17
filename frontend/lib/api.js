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
    throw new Error(Array.isArray(message) ? message.join(', ') : message)
  }
  return data
}

export const api = {
  // Auth
  getCaptcha: () => request('/auth/captcha'),
  sendOtp: (mobile, email) => request('/auth/otp/send', { method: 'POST', body: { mobile, ...(email ? { email } : {}) } }),
  verifyOtp: (mobile, otp, email) => request('/auth/otp/verify', { method: 'POST', body: { mobile, otp, ...(email ? { email } : {}) } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (identifier, password) => request('/auth/login', { method: 'POST', body: { identifier, password } }),
  getMe: (token) => request('/auth/me', { token }),
  guestLogin: (mobile, otp) => request('/auth/guest', { method: 'POST', body: { mobile, otp } }),

  // Location — cascading dropdowns
  getCountries: () => request('/location/countries'),
  getStates: (countryId) => request(`/location/states?countryId=${encodeURIComponent(countryId)}`),
  getDistricts: (stateId) => request(`/location/districts?stateId=${encodeURIComponent(stateId)}`),
  getCities: (districtId) => request(`/location/cities?districtId=${encodeURIComponent(districtId)}`),

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
  getProduct: (id) => request(`/marketplace/products/${id}`),
  getMyProducts: (params = {}, token) =>
    request('/marketplace/my-products?' + new URLSearchParams(params).toString(), { token }),
  contactSeller: (id, token) => request(`/marketplace/products/${id}/contact`, { method: 'POST', token }),
  getMyPurchases: (token) => request('/marketplace/my-purchases', { token }),

  // Membership
  getMembershipPlans: () => request('/membership/plans'),
  getMyMembershipStatus: (token) => request('/membership/my-status', { token }),
  subscribeMembership: (planCode, token, paymentReference) =>
    request('/membership/subscribe', { method: 'POST', token, body: { planCode, ...(paymentReference ? { paymentReference } : {}) } }),

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
