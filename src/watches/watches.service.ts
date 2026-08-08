import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWatchDto } from './dto/create-watch.dto';
import { ListWatchesQueryDto } from './dto/list-watches-query.dto';
import { Watch } from './entities/watch.entity';
import { WatchStatus } from './enums/watch-status.enum';

@Injectable()
export class WatchesService {
  constructor(
    @InjectRepository(Watch)
    private readonly watchesRepository: Repository<Watch>,
  ) {}

  async create(sellerId: string, dto: CreateWatchDto): Promise<Watch> {
    const watch = this.watchesRepository.create({
      referenceNumber: dto.referenceNumber,
      serialNumber: dto.serialNumber,
      brand: dto.brand,
      model: dto.model,
      askingPrice: dto.askingPrice.toFixed(2),
      condition: dto.condition,
      photos: dto.photos,
      sellerId,
      status: WatchStatus.LISTED,
    });

    return this.watchesRepository.save(watch);
  }

  async findAll(query: ListWatchesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = query.status ? { status: query.status } : {};

    const [data, total] = await this.watchesRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string): Promise<Watch> {
    const watch = await this.watchesRepository.findOne({ where: { id } });

    if (!watch) {
      throw new NotFoundException(`Watch ${id} not found`);
    }

    return watch;
  }
}
