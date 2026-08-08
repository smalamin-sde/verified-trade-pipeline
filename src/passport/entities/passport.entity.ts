import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LedgerEntry } from './ledger-entry.entity';

@Entity('passports')
export class Passport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'serial_number', unique: true })
  serialNumber: string;

  @OneToMany(() => LedgerEntry, (entry) => entry.passport)
  entries: LedgerEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
