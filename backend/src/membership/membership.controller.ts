import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { MembershipService } from './membership.service'
import { SubscribeDto } from './dto/subscribe.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Membership')
@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available membership plans' })
  getPlans() {
    return this.membershipService.getPlans()
  }

  @Get('my-status')
  @ApiOperation({ summary: 'Current user membership status + free-tier usage/remaining' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyStatus(@Request() req) {
    return this.membershipService.getMyStatus(req.user.userId)
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to the Quarterly Membership (₹100 / 90 days)' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  subscribe(@Body() dto: SubscribeDto, @Request() req) {
    return this.membershipService.subscribe(req.user.userId, dto)
  }
}
