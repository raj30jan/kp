// Browser session id — persists in localStorage so a guest's service
// selections can be tied together (and later linked to their user account
// once they register/login). Used by the support team for follow-up calls.

const KEY = 'kp_session_id'

export function getSessionId() {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
