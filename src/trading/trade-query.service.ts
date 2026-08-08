import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildBuyerProjection,
  buildSellerProjection,
  TradeProjection,
} from './domain/trade-projection.factory';
import { Trade } from './entities/trade.entity';

@Injectable()
export class TradeQueryService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
  ) {}

  async getTradeProjection(
    tradeId: string,
    userId: string,
  ): Promise<TradeProjection> {
    const trade = await this.tradesRepository.findOne({ where: { id: tradeId } });

    if (!trade) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }

    if (trade.buyerId === userId) {
      return buildBuyerProjection(trade);
    }

    if (trade.sellerId === userId) {
      return buildSellerProjection(trade);
    }

    throw new ForbiddenException('You are not a participant on this trade');
  }
}
