import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { applyTransition } from '../trading/domain/trade-state-machine';
import { TradeTransitionError } from '../trading/domain/trade-transition.error';
import { Trade } from '../trading/entities/trade.entity';
import { TradeAction } from '../trading/enums/trade-action.enum';
import { TradeState } from '../trading/enums/trade-state.enum';
import { computeRequestHash } from './domain/request-hash.util';
import { EscrowHold } from './entities/escrow-hold.entity';
import { IdempotencyRecord } from './entities/idempotency-record.entity';
import { EscrowHoldStatus } from './enums/escrow-hold-status.enum';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
    @InjectRepository(EscrowHold)
    private readonly escrowHoldsRepository: Repository<EscrowHold>,
    @InjectRepository(IdempotencyRecord)
    private readonly idempotencyRecordsRepository: Repository<IdempotencyRecord>,
    private readonly dataSource: DataSource,
  ) {}

  async fundEscrow(
    tradeId: string,
    buyerId: string,
    idempotencyKey: string,
    body: Record<string, unknown> = {},
  ): Promise<Trade> {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const requestHash = computeRequestHash(tradeId, body);
    const existingRecord = await this.idempotencyRecordsRepository.findOne({
      where: { idempotencyKey },
    });

    if (existingRecord) {
      if (existingRecord.tradeId !== tradeId) {
        throw new ConflictException(
          'Idempotency-Key was already used for a different trade',
        );
      }

      if (existingRecord.requestHash !== requestHash) {
        throw new ConflictException(
          'Idempotency-Key was already used with a different request body',
        );
      }

      return existingRecord.responseBody as unknown as Trade;
    }

    const trade = await this.tradesRepository.findOne({ where: { id: tradeId } });

    if (!trade) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }

    if (trade.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer can fund escrow');
    }

    if (trade.state !== TradeState.AUTH_PASSED) {
      throw new ConflictException(
        `Trade must be in AUTH_PASSED to fund escrow (current: ${trade.state})`,
      );
    }

    if (trade.escrowDeadline && new Date() > trade.escrowDeadline) {
      throw new ConflictException('Escrow funding deadline has passed');
    }

    const existingHold = await this.escrowHoldsRepository.findOne({
      where: { tradeId },
    });

    if (existingHold) {
      throw new ConflictException('Escrow has already been funded for this trade');
    }

    return this.dataSource.transaction(async (manager) => {
      try {
        applyTransition(trade, TradeAction.FUND_ESCROW);
      } catch (error) {
        if (error instanceof TradeTransitionError) {
          throw new ConflictException(error.message);
        }
        throw error;
      }

      const savedTrade = await manager.save(trade);

      const hold = manager.create(EscrowHold, {
        tradeId,
        buyerId: trade.buyerId,
        sellerId: trade.sellerId,
        amount: trade.grossAmount,
        status: EscrowHoldStatus.HELD,
      });

      await manager.save(hold);

      const record = manager.create(IdempotencyRecord, {
        idempotencyKey,
        requestHash,
        tradeId,
        responseBody: savedTrade as unknown as Record<string, unknown>,
      });

      await manager.save(record);

      return savedTrade;
    });
  }

  async releaseToSeller(tradeId: string, manager?: EntityManager): Promise<EscrowHold> {
    const repo = manager
      ? manager.getRepository(EscrowHold)
      : this.escrowHoldsRepository;

    const hold = await repo.findOne({ where: { tradeId } });

    if (!hold) {
      throw new NotFoundException(`Escrow hold for trade ${tradeId} not found`);
    }

    if (hold.status !== EscrowHoldStatus.HELD) {
      throw new ConflictException(
        `Escrow hold is not in HELD status (current: ${hold.status})`,
      );
    }

    hold.status = EscrowHoldStatus.RELEASED;
    return repo.save(hold);
  }
}
