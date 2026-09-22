import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ActivityLogService } from './activity-log.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Activity')
@Controller('activity')
export class ActivityLogController {
  constructor(private readonly activityLog: ActivityLogService) {}

  @Get('my-activity')
  @ApiOperation({ summary: "Logged-in user's recent activity (newest first)" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async mine(@Request() req, @Query('limit') limit?: string) {
    const n = Math.min(Math.max(parseInt(limit || '20', 10) || 20, 1), 100)
    const rows = await this.activityLog.findMine(req.user.userId, n)
    return {
      items: rows.map((r: any) => ({
        id: String(r._id),
        action: r.action,
        meta: r.meta || null,
        at: r.createdAt,
      })),
    }
  }
}
