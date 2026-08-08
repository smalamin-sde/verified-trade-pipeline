import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../identity/entities/user.entity';
import { Watch } from '../../watches/entities/watch.entity';
import { TradeState } from '../enums/trade-state.enum';

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'watch_id' })
  watchId: string;

  @ManyToOne(() => Watch)
  @JoinColumn({ name: 'watch_id' })
  watch: Watch;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ type: 'enum', enum: TradeState, default: TradeState.DRAFT })
  state: TradeState;

  @Column({ name: 'gross_amount', type: 'decimal', precision: 12, scale: 2 })
  grossAmount: string;

  @Column({ name: 'commission_amount', type: 'decimal', precision: 12, scale: 2 })
  commissionAmount: string;

  @Column({ name: 'net_payout', type: 'decimal', precision: 12, scale: 2 })
  netPayout: string;

  @Column({ name: 'escrow_deadline', type: 'timestamptz', nullable: true })
  escrowDeadline: Date | null;

  @Column({ name: 'shipment_sla_deadline', type: 'timestamptz', nullable: true })
  shipmentSlaDeadline: Date | null;

  @Column({ name: 'dispute_window_ends', type: 'timestamptz', nullable: true })
  disputeWindowEnds: Date | null;

  @Column({ name: 'tracking_number', type: 'varchar', nullable: true })
  trackingNumber: string | null;

  @Column({ name: 'dispute_reason', type: 'text', nullable: true })
  disputeReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
