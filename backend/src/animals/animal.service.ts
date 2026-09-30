import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { AnimalType } from './entities/animal-type.entity'
import { AnimalBreed } from './entities/animal-breed.entity'
import { AnimalListing } from './entities/animal-listing.entity'
import { AnimalListingImage } from './entities/animal-listing-image.entity'
import { CreateAnimalDto } from './dto/create-animal.dto'
import { ListAnimalsDto } from './dto/list-animals.dto'
import { saveProductImages, deleteProductImages } from '../marketplace/product-image.util'
import { saveProductVideo, deleteProductVideo } from '../marketplace/product-video.util'

const LISTING_DAYS = 30

@Injectable()
export class AnimalService {
  constructor(
    @InjectRepository(AnimalType) private readonly typeRepo: Repository<AnimalType>,
    @InjectRepository(AnimalBreed) private readonly breedRepo: Repository<AnimalBreed>,
    @InjectRepository(AnimalListing) private readonly listingRepo: Repository<AnimalListing>,
    @InjectRepository(AnimalListingImage) private readonly imageRepo: Repository<AnimalListingImage>,
  ) {}

  /** All active animal types with their breeds — feeds the type→breed dropdowns. */
  async getTypes() {
    return this.typeRepo.find({
      where: { isActive: 1 },
      relations: ['breeds'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    })
  }

  async getBreeds(animalTypeId: number) {
    return this.breedRepo.find({
      where: { animalTypeId: String(animalTypeId) },
      order: { displayOrder: 'ASC', name: 'ASC' },
    })
  }

  /** Public browse list of approved animal listings. */
  async list(query: ListAnimalsDto) {
    const page = query.page || 1
    const limit = Math.min(query.limit || 24, 60)

    const qb = this.listingRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.type', 'type')
      .leftJoinAndSelect('l.breed', 'breed')
      .leftJoinAndSelect('l.images', 'img')
      .where('l.status = :status', { status: 'active' })

    if (query.animalTypeId) qb.andWhere('l.animalTypeId = :t', { t: query.animalTypeId })
    if (query.breedId) qb.andWhere('l.breedId = :b', { b: query.breedId })
    if (query.state) qb.andWhere('l.state = :st', { st: query.state })
    if (query.district) qb.andWhere('l.district = :d', { d: query.district })
    if (query.minPrice != null) qb.andWhere('l.price >= :minp', { minp: query.minPrice })
    if (query.maxPrice != null) qb.andWhere('l.price <= :maxp', { maxp: query.maxPrice })
    if (query.q) {
      qb.andWhere('(l.title LIKE :q OR l.description LIKE :q OR breed.name LIKE :q OR type.name LIKE :q)', {
        q: `%${query.q}%`,
      })
    }

    switch (query.sort) {
      case 'price_asc':
        qb.orderBy('l.price', 'ASC')
        break
      case 'price_desc':
        qb.orderBy('l.price', 'DESC')
        break
      case 'milk_desc':
        qb.orderBy('l.milkCapacity', 'DESC')
        break
      default:
        qb.orderBy('l.createdAt', 'DESC')
    }

    qb.skip((page - 1) * limit).take(limit)
    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const listing = await this.listingRepo.findOne({
      where: { id },
      relations: ['type', 'breed', 'images'],
    })
    if (!listing || listing.status === 'deleted') throw new NotFoundException('Animal listing not found')
    await this.listingRepo.increment({ id }, 'views', 1)
    return listing
  }

  /** Seller's own listings. */
  async myListings(sellerId: string) {
    return this.listingRepo.find({
      where: { sellerId },
      relations: ['type', 'breed', 'images'],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Create a listing. Images go to animal_listing_images (normalized rows);
   * the optional video lands on the listing row. Status starts 'pending'
   * for admin approval, same as marketplace products.
   */
  async create(
    dto: CreateAnimalDto,
    sellerId: string,
    files?: Array<{ buffer: Buffer; originalname: string }>,
    video?: { buffer: Buffer; originalname: string; mimetype?: string },
  ) {
    if (!sellerId) throw new BadRequestException('Login required to post an animal')
    if (!dto.animalTypeId) throw new BadRequestException('animalTypeId is required')
    if (!dto.mobile) throw new BadRequestException('Mobile number is required for every listing')

    const type = await this.typeRepo.findOne({ where: { id: String(dto.animalTypeId) } })
    if (!type) throw new BadRequestException('Invalid animal type')

    let breed: AnimalBreed | null = null
    if (dto.breedId) {
      breed = await this.breedRepo.findOne({ where: { id: String(dto.breedId) } })
      if (!breed) throw new BadRequestException('Invalid breed')
      if (String(breed.animalTypeId) !== String(dto.animalTypeId)) {
        throw new BadRequestException('Breed does not belong to the selected animal type')
      }
    }

    const id = uuidv4()
    const savedImages =
      files && files.length ? await saveProductImages(`animals-${type.code}`, id, files) : null

    let videoUrl: string | null = null
    if (video) {
      try {
        videoUrl = await saveProductVideo(`animals-${type.code}`, id, video)
      } catch (e: any) {
        deleteProductImages(`animals-${type.code}`, id)
        throw new BadRequestException(`Could not process video: ${e?.message || 'unknown error'}`)
      }
    }

    const listing = this.listingRepo.create({
      id,
      sellerId,
      animalTypeId: String(dto.animalTypeId),
      breedId: dto.breedId ? String(dto.breedId) : null,
      title: dto.title,
      description: dto.description || null,
      gender: dto.gender || 'female',
      ageYears: dto.ageYears ?? null,
      ageMonths: dto.ageMonths ?? null,
      milkCapacity: dto.milkCapacity ?? null,
      lactationNumber: dto.lactationNumber ?? null,
      isPregnant: dto.isPregnant ? 1 : 0,
      monthsPregnant: dto.isPregnant ? dto.monthsPregnant ?? null : null,
      price: dto.price,
      isNegotiable: dto.isNegotiable === 0 ? 0 : 1,
      mobile: dto.mobile,
      email: dto.email || null,
      location: dto.location || null,
      state: dto.state || null,
      district: dto.district || null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      videoUrl,
      status: 'pending',
      activatedAt: null,
      expiresAt: null,
    })

    const saved = await this.listingRepo.save(listing)

    if (savedImages && savedImages.length) {
      await this.imageRepo.save(
        savedImages.map((img, i) =>
          this.imageRepo.create({
            listingId: id,
            imageUrl: img.full,
            thumbUrl: img.thumb,
            sortOrder: i,
          }),
        ),
      )
    }

    return this.findOne(saved.id)
  }

  /** Owner-only soft delete + image cleanup. */
  async remove(id: string, sellerId: string) {
    const listing = await this.listingRepo.findOne({ where: { id } })
    if (!listing) throw new NotFoundException('Animal listing not found')
    if (listing.sellerId !== sellerId) throw new BadRequestException('Not your listing')
    listing.status = 'deleted'
    await this.listingRepo.save(listing)
    const type = await this.typeRepo.findOne({ where: { id: listing.animalTypeId } })
    if (type) {
      deleteProductImages(`animals-${type.code}`, id)
      if (listing.videoUrl) deleteProductVideo(`animals-${type.code}`, id)
    }
    return { ok: true }
  }

  // ============ ADMIN: animal type & breed management ============
  // The admin categories page shows these as a separate "Animals" tree.

  /** All types incl. inactive, each with its breeds — feeds the admin tree. */
  async listTypesAdmin() {
    return this.typeRepo.find({
      relations: ['breeds'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    })
  }

  async findTypeAdmin(id: string) {
    const t = await this.typeRepo.findOne({ where: { id }, relations: ['breeds'] })
    if (!t) throw new NotFoundException('Animal type not found')
    return t
  }

  async findBreedAdmin(id: string) {
    const b = await this.breedRepo.findOne({ where: { id } })
    if (!b) throw new NotFoundException('Animal breed not found')
    return b
  }

  private slugifyAnimalCode(name: string) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  async createType(dto: { name: string; code?: string; nameHi?: string; displayOrder?: number }) {
    const name = (dto.name || '').trim()
    if (!name) throw new BadRequestException('Type name is required')
    const code = (dto.code || this.slugifyAnimalCode(name)).trim()
    if (!code) throw new BadRequestException('Type code is required')
    const dup = await this.typeRepo.findOne({ where: { code } })
    if (dup) throw new BadRequestException(`Code "${code}" already exists`)
    return this.typeRepo.save(
      this.typeRepo.create({
        code,
        name,
        nameHi: dto.nameHi || null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: 1,
      }),
    )
  }

  async updateType(
    id: string,
    dto: { name?: string; code?: string; nameHi?: string; displayOrder?: number; isActive?: number },
  ) {
    const t = await this.findTypeAdmin(id)
    if (dto.name != null) t.name = dto.name.trim()
    if (dto.code != null && dto.code !== t.code) {
      const code = dto.code.trim()
      const dup = await this.typeRepo.findOne({ where: { code } })
      if (dup) throw new BadRequestException(`Code "${code}" already exists`)
      t.code = code
    }
    if (dto.nameHi !== undefined) t.nameHi = dto.nameHi || null
    if (dto.displayOrder !== undefined) t.displayOrder = dto.displayOrder
    if (dto.isActive !== undefined) t.isActive = dto.isActive
    return this.typeRepo.save(t)
  }

  /** Flip is_active — deactivating a type also hides its breeds from sellers. */
  async toggleTypeActive(id: string) {
    const t = await this.findTypeAdmin(id)
    t.isActive = t.isActive ? 0 : 1
    return this.typeRepo.save(t)
  }

  async createBreed(dto: { animalTypeId: string; name: string; nameHi?: string; displayOrder?: number }) {
    const name = (dto.name || '').trim()
    if (!name) throw new BadRequestException('Breed name is required')
    const type = await this.typeRepo.findOne({ where: { id: String(dto.animalTypeId) } })
    if (!type) throw new BadRequestException('Invalid animal type')
    return this.breedRepo.save(
      this.breedRepo.create({
        animalTypeId: String(dto.animalTypeId),
        name,
        nameHi: dto.nameHi || null,
        displayOrder: dto.displayOrder ?? 0,
      }),
    )
  }

  async updateBreed(
    id: string,
    dto: { animalTypeId?: string; name?: string; nameHi?: string; displayOrder?: number },
  ) {
    const b = await this.findBreedAdmin(id)
    if (dto.animalTypeId != null) {
      const type = await this.typeRepo.findOne({ where: { id: String(dto.animalTypeId) } })
      if (!type) throw new BadRequestException('Invalid animal type')
      b.animalTypeId = String(dto.animalTypeId)
    }
    if (dto.name != null) b.name = dto.name.trim()
    if (dto.nameHi !== undefined) b.nameHi = dto.nameHi || null
    if (dto.displayOrder !== undefined) b.displayOrder = dto.displayOrder
    return this.breedRepo.save(b)
  }
}
