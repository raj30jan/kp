import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { AdminAnimalsService } from './admin-animals.service'
import { AdminGuard } from '../auth/admin.guard'

@ApiTags('Admin — Animal Listings')
@Controller('animals/admin')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminAnimalsController {
  constructor(private readonly service: AdminAnimalsService) {}

  @Get('listings')
  @ApiOperation({ summary: '[Admin] List animal listings for the approval queue (default: pending)' })
  @ApiQuery({ name: 'status', required: false, description: 'pending | active | rejected | deleted | all' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'search title / description / type / breed' })
  async list(
    @Query('status') status = 'pending',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('q') q?: string,
  ) {
    return this.service.list(status, Number(page), Number(limit), q)
  }

  @Get('stats')
  @ApiOperation({ summary: '[Admin] Animal listing counts grouped by status' })
  async stats() {
    return this.service.stats()
  }

  @Post('listings/:id/activate')
  @ApiOperation({ summary: '[Admin] Approve an animal listing — goes live for 30 days' })
  async activate(@Param('id') id: string) {
    return this.service.activate(id)
  }

  @Post('listings/:id/reject')
  @ApiOperation({ summary: '[Admin] Reject a pending animal listing' })
  async reject(@Param('id') id: string) {
    return this.service.reject(id)
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: '[Admin] Delete an animal listing (soft delete + file cleanup)' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  @Post('listings/bulk')
  @ApiOperation({ summary: '[Admin] Bulk activate / reject / delete selected listings' })
  async bulk(
    @Query('action') action: 'activate' | 'reject' | 'delete',
    @Body() body: { ids?: string[] },
  ) {
    return this.service.bulkAction(body?.ids || [], action)
  }
}
