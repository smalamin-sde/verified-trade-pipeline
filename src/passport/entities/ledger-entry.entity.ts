import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LedgerEntryType } from '../enums/ledger-entry-type.enum';
import { Passport } from './passport.entity';

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'passport_id' })
  passportId: string;

  @ManyToOne(() => Passport, (passport) => passport.entries, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'passport_id' })
  passport: Passport;

  @Column({ type: 'enum', enum: LedgerEntryType })
  type: LedgerEntryType;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Column({ name: 'prev_hash', type: 'varchar', length: 64 })
  prevHash: string;

  @Column({ name: 'this_hash', type: 'varchar', length: 64 })
  thisHash: string;

  @Column({ type: 'varchar', length: 128 })
  signature: string;

  @Column({ type: 'varchar', length: 255 })
  signer: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
