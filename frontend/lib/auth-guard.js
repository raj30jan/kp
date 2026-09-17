// Centralized list of routes that are reachable WITHOUT being logged in.
// Every other route in the app requires a valid kp_token in localStorage —
// unauthenticated users are redirected to /login (with ?next= so we can
// send them back after they log in).
export const PUBLIC_PATHS = ['/', '/login', '/register', '/verify-otp']

export function isPublicPath(pathname) {
  if (!pathname) return true
  return PUBLIC_PATHS.some((p) => pathname === p)
}
