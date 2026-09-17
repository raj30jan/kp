import { Controller, Get, Param, Patch, Query, Request, UseGuards } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'
import { Notification } from './entities/notification.entity'
import { AdminNotification } from './entities/admin-notification.entity'

@ApiTags('Notifications')
@Controller()
export class NotificationController {
  constructor(
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    @InjectRepository(AdminNotification) private readonly adminNotifRepo: Repository<AdminNotification>,
  ) {}

  @Get('notifications/me')
  @ApiOperation({ summary: "List the logged-in user's notifications (likes, contacts, edits, feedback)" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async myNotifications(@Request() req) {
    const items = await this.notifRepo.find({
      where: { userId: req.user?.userId },
      order: { createdAt: 'DESC' },
      take: 100,
    })
    return { items }
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async markRead(@Param('id') id: string, @Request() req) {
    await this.notifRepo.update({ id, userId: req.user?.userId }, { isRead: 1 })
    return { success: true }
  }

  @Get('admin/notifications')
  @ApiOperation({ summary: '[Admin] List all engagement notifications (likes, contacts, edits, feedback)' })
  @UseGuards(AdminGuard)
  async adminList(@Query('page') page = '1', @Query('limit') limit = '50') {
    const take = Math.min(Number(limit) || 50, 200)
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take
    const [items, total] = await this.adminNotifRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take,
      skip,
    })
    return { items, total }
  }

  @Patch('admin/notifications/:id/read')
  @ApiOperation({ summary: '[Admin] Mark an admin notification as read' })
  @UseGuards(AdminGuard)
  async adminMarkRead(@Param('id') id: string) {
    await this.adminNotifRepo.update({ id: Number(id) }, { isRead: 1 })
    return { success: true }
  }
}
