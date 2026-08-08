import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../identity/entities/user.entity';
import { Trade } from '../../trading/entities/trade.entity';
import { AuthVerdict } from '../enums/auth-verdict.enum';

@Entity('authentication_reports')
export class AuthenticationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trade_id', unique: true })
  tradeId: string;

  @ManyToOne(() => Trade)
  @JoinColumn({ name: 'trade_id' })
  trade: Trade;

  @Column({ name: 'authenticator_id' })
  authenticatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authenticator_id' })
  authenticator: User;

  @Column({ type: 'enum', enum: AuthVerdict })
  verdict: AuthVerdict;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'photo_hashes', type: 'jsonb', default: [] })
  photoHashes: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
