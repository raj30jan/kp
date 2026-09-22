import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FarmService } from './farm.service'
import { CreateFarmDto } from './dto/create-farm.dto'
import { UpdateFarmDto } from './dto/update-farm.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@ApiTags('Farm')
@Controller('farm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FarmController {
  constructor(private readonly farmService: FarmService) {}

  @Get('my-plots')
  @ApiOperation({ summary: "List the logged-in user's farm plots" })
  listMine(@Request() req) {
    return this.farmService.listMine(req.user.userId)
  }

  @Post('my-plots')
  @ApiOperation({ summary: 'Add a new farm plot' })
  create(@Body() dto: CreateFarmDto, @Request() req) {
    return this.farmService.create(req.user.userId, dto)
  }

  @Patch('my-plots/:id')
  @ApiOperation({ summary: "Edit one of the logged-in user's farm plots" })
  update(@Param('id') id: string, @Body() dto: UpdateFarmDto, @Request() req) {
    return this.farmService.update(id, req.user.userId, dto)
  }

  @Delete('my-plots/:id')
  @ApiOperation({ summary: "Remove one of the logged-in user's farm plots" })
  remove(@Param('id') id: string, @Request() req) {
    return this.farmService.remove(id, req.user.userId)
  }
}
