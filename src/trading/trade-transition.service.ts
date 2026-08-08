import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthenticationReport } from '../authentication/entities/authentication-report.entity';
import { AuthVerdict } from '../authentication/enums/auth-verdict.enum';
import { AuthenticationVerdictDto } from '../authentication/dto/authentication-verdict.dto';
import { EscrowService } from '../escrow/escrow.service';
import { PassportService } from '../passport/passport.service';
import { LedgerEntryType } from '../passport/enums/ledger-entry-type.enum';
import { Watch } from '../watches/entities/watch.entity';
import { WatchStatus } from '../watches/enums/watch-status.enum';
import { calculateCommission } from './domain/commission.util';
import { applyTransition } from './domain/trade-state-machine';
import { TradeAction } from './enums/trade-action.enum';
import { TradeState } from './enums/trade-state.enum';
import { TradeTransitionError } from './domain/trade-transition.error';
import { Trade } from './entities/trade.entity';
import { TERMINAL_TRADE_STATES } from './domain/trade-state-machine';
import { MarkShippedDto } from './dto/mark-shipped.dto';
import { DisputeDto } from './dto/dispute.dto';

@Injectable()
export class TradeTransitionService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
    @InjectRepository(Watch)
    private readonly watchesRepository: Repository<Watch>,
    @InjectRepository(AuthenticationReport)
    private readonly authenticationReportsRepository: Repository<AuthenticationReport>,
    private readonly passportService: PassportService,
    private readonly escrowService: EscrowService,
    private readonly dataSource: DataSource,
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

  async recordAuthenticationVerdict(
    tradeId: string,
    authenticatorId: string,
    dto: AuthenticationVerdictDto,
  ): Promise<Trade> {
    const trade = await this.tradesRepository.findOne({ where: { id: tradeId } });

    if (!trade) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }

    const watch = await this.watchesRepository.findOne({
      where: { id: trade.watchId },
    });

    if (!watch) {
      throw new NotFoundException(`Watch ${trade.watchId} not found`);
    }

    if (trade.state !== TradeState.PENDING_AUTH) {
      throw new ConflictException(
        `Trade must be in PENDING_AUTH for authentication verdict (current: ${trade.state})`,
      );
    }

    const existingReport = await this.authenticationReportsRepository.findOne({
      where: { tradeId },
    });

    if (existingReport) {
      throw new ConflictException('Authentication verdict already recorded for this trade');
    }

    if (!watch.passportId) {
      throw new ConflictException('Watch has no linked passport for ledger update');
    }

    const action =
      dto.verdict === AuthVerdict.PASS ? TradeAction.AUTH_PASS : TradeAction.AUTH_FAIL;

    const ledgerType =
      dto.verdict === AuthVerdict.PASS
        ? LedgerEntryType.AUTHENTICATED
        : LedgerEntryType.RE_AUTHENTICATED;

    return this.dataSource.transaction(async (manager) => {
      const report = manager.create(AuthenticationReport, {
        tradeId,
        authenticatorId,
        verdict: dto.verdict,
        notes: dto.notes ?? null,
        photoHashes: dto.photoHashes ?? [],
      });

      try {
        await manager.save(report);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException(
            'Authentication verdict already recorded for this trade',
          );
        }
        throw error;
      }

      try {
        applyTransition(trade, action);
      } catch (error) {
        if (error instanceof TradeTransitionError) {
          throw new ConflictException(error.message);
        }
        throw error;
      }

      await this.passportService.appendEntry(
        watch.passportId as string,
        {
          type: ledgerType,
          payload: {
            tradeId,
            verdict: dto.verdict,
            notes: dto.notes ?? null,
          },
          signer: authenticatorId,
        },
        manager,
      );

      return manager.save(trade);
    });
  }

  async markShipped(
    tradeId: string,
    sellerId: string,
    dto: MarkShippedDto,
  ): Promise<Trade> {
    const trade = await this.loadTradeOrThrow(tradeId);

    if (trade.sellerId !== sellerId) {
      throw new ForbiddenException('Only the seller can mark the trade as shipped');
    }

    if (trade.state !== TradeState.ESCROW_FUNDED) {
      throw new ConflictException(
        `Trade must be in ESCROW_FUNDED to mark shipped (current: ${trade.state})`,
      );
    }

    if (trade.shipmentSlaDeadline && new Date() > trade.shipmentSlaDeadline) {
      throw new ConflictException('Shipment SLA deadline has passed');
    }

    this.applyTransitionOrThrow(trade, TradeAction.MARK_SHIPPED);
    trade.trackingNumber = dto.trackingNumber;

    return this.tradesRepository.save(trade);
  }

  async markDelivered(tradeId: string): Promise<Trade> {
    const trade = await this.loadTradeOrThrow(tradeId);

    if (trade.state !== TradeState.SHIPPED) {
      throw new ConflictException(
        `Trade must be in SHIPPED to mark delivered (current: ${trade.state})`,
      );
    }

    this.applyTransitionOrThrow(trade, TradeAction.MARK_DELIVERED);

    return this.tradesRepository.save(trade);
  }

  async release(tradeId: string, buyerId: string): Promise<Trade> {
    const trade = await this.loadTradeOrThrow(tradeId);
    const watch = await this.loadWatchOrThrow(trade.watchId);

    if (trade.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer can release funds to the seller');
    }

    if (
      trade.state !== TradeState.DELIVERED &&
      trade.state !== TradeState.DISPUTED
    ) {
      throw new ConflictException(
        `Trade must be in DELIVERED or DISPUTED to release (current: ${trade.state})`,
      );
    }

    if (trade.state === TradeState.DELIVERED) {
      if (trade.disputeWindowEnds && new Date() > trade.disputeWindowEnds) {
        throw new ConflictException('Dispute window has closed');
      }
    }

    if (!watch.passportId) {
      throw new ConflictException('Watch has no linked passport for ledger update');
    }

    return this.dataSource.transaction(async (manager) => {
      this.applyTransitionOrThrow(trade, TradeAction.RELEASE);

      await this.escrowService.releaseToSeller(tradeId, manager);

      await this.passportService.appendEntry(
        watch.passportId as string,
        {
          type: LedgerEntryType.TRANSFERRED,
          payload: {
            tradeId,
            buyerId: trade.buyerId,
            sellerId: trade.sellerId,
            netPayout: trade.netPayout,
          },
          signer: buyerId,
        },
        manager,
      );

      return manager.save(trade);
    });
  }

  async dispute(tradeId: string, buyerId: string, dto: DisputeDto): Promise<Trade> {
    const trade = await this.loadTradeOrThrow(tradeId);

    if (trade.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer can dispute a trade');
    }

    if (trade.state !== TradeState.DELIVERED) {
      throw new ConflictException(
        `Trade must be in DELIVERED to dispute (current: ${trade.state})`,
      );
    }

    if (trade.disputeWindowEnds && new Date() > trade.disputeWindowEnds) {
      throw new ConflictException('Dispute window has closed');
    }

    this.applyTransitionOrThrow(trade, TradeAction.DISPUTE);
    trade.disputeReason = dto.disputeReason;

    return this.tradesRepository.save(trade);
  }

  private async loadTradeOrThrow(tradeId: string): Promise<Trade> {
    const trade = await this.tradesRepository.findOne({ where: { id: tradeId } });

    if (!trade) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }

    return trade;
  }

  private async loadWatchOrThrow(watchId: string): Promise<Watch> {
    const watch = await this.watchesRepository.findOne({ where: { id: watchId } });

    if (!watch) {
      throw new NotFoundException(`Watch ${watchId} not found`);
    }

    return watch;
  }

  private applyTransitionOrThrow(trade: Trade, action: TradeAction): void {
    try {
      applyTransition(trade, action);
    } catch (error) {
      if (error instanceof TradeTransitionError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
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
