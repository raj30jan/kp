import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import { Response } from 'express'
import { AdminRedirectException } from './admin-redirect.exception'

@Catch(AdminRedirectException)
export class AdminRedirectFilter implements ExceptionFilter {
  catch(exception: AdminRedirectException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>()
    if (exception.flash) {
      res.cookie('admin_flash', exception.flash, { maxAge: 5000, httpOnly: true })
    }
    res.redirect(exception.location)
  }
}
