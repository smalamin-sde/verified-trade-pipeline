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
import { Passport } from '../../passport/entities/passport.entity';
import { WatchCondition } from '../enums/watch-condition.enum';
import { WatchStatus } from '../enums/watch-status.enum';

@Entity('watches')
export class Watch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reference_number', unique: true })
  referenceNumber: string;

  @Column({ name: 'serial_number', unique: true })
  serialNumber: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column({ name: 'asking_price', type: 'decimal', precision: 12, scale: 2 })
  askingPrice: string;

  @Column({ type: 'enum', enum: WatchCondition })
  condition: WatchCondition;

  @Column({ type: 'jsonb', default: [] })
  photos: string[];

  @Column({ type: 'enum', enum: WatchStatus, default: WatchStatus.LISTED })
  status: WatchStatus;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'passport_id', type: 'uuid', nullable: true })
  passportId: string | null;

  @ManyToOne(() => Passport, { nullable: true })
  @JoinColumn({ name: 'passport_id' })
  passport: Passport | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
