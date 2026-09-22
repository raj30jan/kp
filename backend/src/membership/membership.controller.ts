import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { MembershipService } from './membership.service'
import { SubscribeDto } from './dto/subscribe.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SettingsService } from '../settings/settings.service'

@ApiTags('Membership')
@Controller('membership')
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly settings: SettingsService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available membership plans' })
  getPlans() {
    return this.membershipService.getPlans()
  }

  @Get('payment-info')
  @ApiOperation({ summary: 'QR code / UPI details (uploaded by super-admin) to pay the membership fee' })
  paymentInfo() {
    return this.settings.getMembershipPaymentInfo()
  }

  @Get('my-status')
  @ApiOperation({ summary: 'Current user membership status + free-tier usage/remaining' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyStatus(@Request() req) {
    return this.membershipService.getMyStatus(req.user.userId)
  }

  @Post('subscribe')
  @ApiOperation({
    summary: 'Submit UPI payment reference for a plan — creates a PENDING subscription that admin activates after verifying the payment',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  subscribe(@Body() dto: SubscribeDto, @Request() req) {
    return this.membershipService.subscribe(req.user.userId, dto)
  }
}
