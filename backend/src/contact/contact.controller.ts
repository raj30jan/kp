import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ContactService } from './contact.service'
import { ContactDto } from './dto/contact.dto'

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({
    summary: 'Public contact-us form — captcha required; stores the enquiry and emails admin + sender',
  })
  submit(@Body() dto: ContactDto) {
    return this.contactService.submit(dto)
  }
}
