import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  buildLedgerEntryFields,
  StoredLedgerEntry,
  verifyChain,
} from './domain/hash-chain';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Passport } from './entities/passport.entity';
import { LedgerEntryType } from './enums/ledger-entry-type.enum';

export interface AppendLedgerEntryInput {
  type: LedgerEntryType;
  payload?: Record<string, unknown>;
  signer: string;
}

@Injectable()
export class PassportService {
  private readonly signingKey: string;

  constructor(
    @InjectRepository(Passport)
    private readonly passportsRepository: Repository<Passport>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntriesRepository: Repository<LedgerEntry>,
    configService: ConfigService,
  ) {
    this.signingKey =
      configService.get<string>('PASSPORT_SIGNING_KEY') ??
      'dev-passport-signing-key-change-me';
  }

  async createForSerial(
    serialNumber: string,
    manager?: EntityManager,
  ): Promise<Passport> {
    const passportsRepo = this.getPassportsRepo(manager);
    const passport = passportsRepo.create({ serialNumber });
    return passportsRepo.save(passport);
  }

  async findBySerial(serialNumber: string): Promise<Passport | null> {
    return this.passportsRepository.findOne({ where: { serialNumber } });
  }

  async getEntriesOrdered(passportId: string): Promise<LedgerEntry[]> {
    return this.ledgerEntriesRepository.find({
      where: { passportId },
      order: { createdAt: 'ASC' },
    });
  }

  async verifyPassportChain(passportId: string): Promise<boolean> {
    const entries = await this.getEntriesOrdered(passportId);
    return verifyChain(entries as StoredLedgerEntry[], this.signingKey);
  }

  async appendEntry(
    passportId: string,
    input: AppendLedgerEntryInput,
    manager?: EntityManager,
  ): Promise<LedgerEntry> {
    const passportsRepo = this.getPassportsRepo(manager);
    const ledgerRepo = this.getLedgerRepo(manager);

    const passport = await passportsRepo.findOne({ where: { id: passportId } });

    if (!passport) {
      throw new NotFoundException(`Passport ${passportId} not found`);
    }

    const previousEntry = await ledgerRepo.findOne({
      where: { passportId },
      order: { createdAt: 'DESC' },
    });

    const createdAt = new Date();
    const hashFields = buildLedgerEntryFields(
      {
        type: input.type,
        payload: input.payload ?? {},
        signer: input.signer,
        createdAt,
      },
      previousEntry as StoredLedgerEntry | null,
      this.signingKey,
    );

    const entry = ledgerRepo.create({
      passportId,
      type: input.type,
      payload: input.payload ?? {},
      signer: input.signer,
      createdAt,
      ...hashFields,
    });

    return ledgerRepo.save(entry);
  }

  private getPassportsRepo(manager?: EntityManager): Repository<Passport> {
    return manager
      ? manager.getRepository(Passport)
      : this.passportsRepository;
  }

  private getLedgerRepo(manager?: EntityManager): Repository<LedgerEntry> {
    return manager
      ? manager.getRepository(LedgerEntry)
      : this.ledgerEntriesRepository;
  }
}
