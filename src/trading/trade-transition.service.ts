import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watch } from '../watches/entities/watch.entity';
import { WatchStatus } from '../watches/enums/watch-status.enum';
import { calculateCommission } from './domain/commission.util';
import { applyTransition } from './domain/trade-state-machine';
import { TradeAction } from './enums/trade-action.enum';
import { TradeState } from './enums/trade-state.enum';
import { TradeTransitionError } from './domain/trade-transition.error';
import { Trade } from './entities/trade.entity';
import { TERMINAL_TRADE_STATES } from './domain/trade-state-machine';

@Injectable()
export class TradeTransitionService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
    @InjectRepository(Watch)
    private readonly watchesRepository: Repository<Watch>,
  ) {}

  async createTrade(buyerId: string, watchId: string): Promise<Trade> {
    const watch = await this.watchesRepository.findOne({ where: { id: watchId } });

    if (!watch) {
      throw new NotFoundException(`Watch ${watchId} not found`);
    }

    if (watch.status !== WatchStatus.LISTED) {
      throw new ConflictException('Watch is not available for purchase');
    }

    if (watch.sellerId === buyerId) {
      throw new ForbiddenException('Seller cannot initiate a trade on their own watch');
    }

    const activeTrade = await this.tradesRepository
      .createQueryBuilder('trade')
      .where('trade.watch_id = :watchId', { watchId })
      .andWhere('trade.state NOT IN (:...terminalStates)', {
        terminalStates: TERMINAL_TRADE_STATES,
      })
      .getOne();

    if (activeTrade) {
      throw new ConflictException(
        'This watch already has an active trade in progress',
      );
    }

    const amounts = calculateCommission(parseFloat(watch.askingPrice));

    const trade = this.tradesRepository.create({
      watchId: watch.id,
      buyerId,
      sellerId: watch.sellerId,
      state: TradeState.DRAFT,
      grossAmount: amounts.grossAmount,
      commissionAmount: amounts.commissionAmount,
      netPayout: amounts.netPayout,
    });

    try {
      return await this.tradesRepository.save(trade);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'This watch already has an active trade in progress',
        );
      }
      throw error;
    }
  }

  async submitForAuth(tradeId: string, sellerId: string): Promise<Trade> {
    const trade = await this.tradesRepository.findOne({ where: { id: tradeId } });

    if (!trade) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }

    if (trade.sellerId !== sellerId) {
      throw new ForbiddenException('Only the seller can submit for authentication');
    }

    if (trade.state !== TradeState.DRAFT) {
      throw new ConflictException(
        `Trade must be in DRAFT to submit for auth (current: ${trade.state})`,
      );
    }

    try {
      applyTransition(trade, TradeAction.SUBMIT_FOR_AUTH);
    } catch (error) {
      if (error instanceof TradeTransitionError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    return this.tradesRepository.save(trade);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}
