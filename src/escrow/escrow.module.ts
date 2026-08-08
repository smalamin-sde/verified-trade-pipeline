import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trade } from '../trading/entities/trade.entity';
import { EscrowHold } from './entities/escrow-hold.entity';
import { IdempotencyRecord } from './entities/idempotency-record.entity';
import { EscrowService } from './escrow.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trade, EscrowHold, IdempotencyRecord])],
  providers: [EscrowService],
  exports: [EscrowService, TypeOrmModule],
})
export class EscrowModule {}
