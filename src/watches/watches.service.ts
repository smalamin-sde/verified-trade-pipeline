import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PassportService } from '../passport/passport.service';
import { CreateWatchDto } from './dto/create-watch.dto';
import { ListWatchesQueryDto } from './dto/list-watches-query.dto';
import { Watch } from './entities/watch.entity';
import { WatchStatus } from './enums/watch-status.enum';

@Injectable()
export class WatchesService {
  constructor(
    @InjectRepository(Watch)
    private readonly watchesRepository: Repository<Watch>,
    private readonly passportService: PassportService,
    private readonly dataSource: DataSource,
  ) {}

  async create(sellerId: string, dto: CreateWatchDto): Promise<Watch> {
    return this.dataSource.transaction(async (manager) => {
      const watch = manager.create(Watch, {
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

      const savedWatch = await manager.save(watch);
      const passport = await this.passportService.createForSerial(
        dto.serialNumber,
        manager,
      );

      savedWatch.passportId = passport.id;
      return manager.save(savedWatch);
    });
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
