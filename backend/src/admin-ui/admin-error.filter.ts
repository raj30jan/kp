import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { AdminRedirectException } from './admin-redirect.exception'

/**
 * Catch-all filter for the admin UI. Catches any unhandled exception
 * (DB errors, template errors, etc.) and renders a friendly error page
 * instead of returning raw JSON like {"statusCode":500,"message":"Internal server error"}.
 *
 * AdminRedirectException is re-thrown so AdminRedirectFilter can handle it.
 */
@Catch()
export class AdminErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const req = ctx.getRequest()

    // Let redirect exceptions pass through to AdminRedirectFilter
    if (exception instanceof AdminRedirectException) {
      if (exception.flash) {
        res.cookie('admin_flash', exception.flash, { maxAge: 5000, httpOnly: true })
      }
      return res.redirect(exception.location)
    }

    // Determine status and message
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'An unexpected error occurred. Please try again or contact support.'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const response = exception.getResponse()
      if (typeof response === 'string') {
        message = response
      } else if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, any>
        message = r.message || r.error || message
        if (Array.isArray(message)) message = message.join(', ')
      }
    } else if (exception instanceof Error) {
      // In dev mode, show the actual error; in prod, show generic message
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message
      }
    }

    // If it's a 403 (forbidden), show a permission message
    if (status === HttpStatus.FORBIDDEN) {
      message = 'You do not have permission to perform this action.'
    }

    // If it's a 404, show not found
    if (status === HttpStatus.NOT_FOUND) {
      message = 'The requested resource was not found.'
    }

    // Render a simple error page instead of JSON
    res.status(status).render('error', {
      title: 'Error',
      statusCode: status,
      message,
      adminName: req.cookies?.admin_name || 'Admin',
      adminUser: req.adminUser || null,
    })
  }
}
