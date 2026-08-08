import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Trade } from '../../trading/entities/trade.entity';
import { EscrowHoldStatus } from '../enums/escrow-hold-status.enum';

@Entity('escrow_holds')
export class EscrowHold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trade_id', unique: true })
  tradeId: string;

  @ManyToOne(() => Trade)
  @JoinColumn({ name: 'trade_id' })
  trade: Trade;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: EscrowHoldStatus, default: EscrowHoldStatus.HELD })
  status: EscrowHoldStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
