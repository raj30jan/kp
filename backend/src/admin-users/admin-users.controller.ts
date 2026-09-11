import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { BulkIdsDto } from '../common/dto/bulk-ids.dto'
import { AdminUsersService } from './admin-users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { SuperAdminGuard } from '../auth/super-admin.guard'

@ApiTags('Admin — User Management')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: '[Super Admin] List all users — search, sort, filter by role, paginated' })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async findAll(
    @Query('role') role?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: 'ASC' | 'DESC',
  ) {
    return this.adminUsersService.findAll(role, Number(page), Number(limit), q, sort, dir)
  }

  @Post()
  @ApiOperation({ summary: '[Super Admin] Create a new user account directly' })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async create(@Body() dto: CreateUserDto) {
    return this.adminUsersService.create(dto)
  }

  @Post('bulk')
  @ApiOperation({ summary: '[Super Admin] Bulk activate/deactivate/delete selected users' })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async bulk(@Query('action') action: 'activate' | 'deactivate' | 'delete', @Body() dto: BulkIdsDto) {
    return this.adminUsersService.bulkAction(dto.ids, action)
  }

  @Get('stats')
  @ApiOperation({ summary: '[Super Admin] User statistics (counts by role, membership)' })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async stats() {
    return this.adminUsersService.getStats()
  }

  @Get(':id')
  @ApiOperation({ summary: '[Super Admin] Get user details' })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Super Admin] Update user (role, displayName, isActive)' })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminUsersService.update(id, dto)
  }

  @Post(':id/promote-admin')
  @ApiOperation({ summary: '[Super Admin] Promote a user to admin role' })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async promoteToAdmin(@Param('id') id: string) {
    return this.adminUsersService.promoteToAdmin(id)
  }

  @Post(':id/demote-user')
  @ApiOperation({ summary: '[Super Admin] Demote an admin back to regular user' })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async demoteToUser(@Param('id') id: string) {
    return this.adminUsersService.demoteToUser(id)
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Super Admin] Soft-delete a user account' })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    return this.adminUsersService.remove(id)
  }

  @Post('bootstrap-super-admin')
  @ApiOperation({
    summary: '[Bootstrap] Promote a user to super_admin using x-admin-key',
    description: 'One-time bootstrap: use ADMIN_API_KEY header to promote the very first super_admin. Requires the user\'s id in the body.',
  })
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  async bootstrapSuperAdmin(@Body('userId') userId: string) {
    return this.adminUsersService.update(userId, { role: 'super_admin' })
  }
}
