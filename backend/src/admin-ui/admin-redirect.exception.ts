import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Thrown by AdminSessionGuard when a request to the server-rendered
 * Backend Admin UI (SRS §3.3, Section 2) has no valid admin session.
 * Caught by AdminRedirectFilter, which issues an HTTP redirect instead
 * of the default JSON error response (this UI is browser-rendered, not
 * an API consumer).
 */
export class AdminRedirectException extends HttpException {
  constructor(public readonly location: string, public readonly flash?: string) {
    super('Redirect', HttpStatus.FOUND)
  }
}
