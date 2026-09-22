import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Farm } from './entities/farm.entity'
import { CreateFarmDto } from './dto/create-farm.dto'
import { UpdateFarmDto } from './dto/update-farm.dto'

@Injectable()
export class FarmService {
  constructor(@InjectRepository(Farm) private readonly farmRepo: Repository<Farm>) {}

  /** All plots belonging to the logged-in user, newest first. */
  async listMine(ownerId: string) {
    return this.farmRepo.find({ where: { ownerId }, order: { createdAt: 'DESC' } })
  }

  async create(ownerId: string, dto: CreateFarmDto) {
    const farm = this.farmRepo.create({ ...dto, ownerId })
    return this.farmRepo.save(farm)
  }

  private async findOwned(id: string, ownerId: string) {
    const farm = await this.farmRepo.findOne({ where: { id } })
    if (!farm) throw new NotFoundException('Farm plot not found')
    if (farm.ownerId !== ownerId) throw new ForbiddenException('Not your farm plot')
    return farm
  }

  async update(id: string, ownerId: string, dto: UpdateFarmDto) {
    const farm = await this.findOwned(id, ownerId)
    Object.assign(farm, dto)
    return this.farmRepo.save(farm)
  }

  async remove(id: string, ownerId: string) {
    const farm = await this.findOwned(id, ownerId)
    await this.farmRepo.softRemove(farm)
    return { removed: true }
  }
}
