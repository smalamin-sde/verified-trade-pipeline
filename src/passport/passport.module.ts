import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Passport } from './entities/passport.entity';
import { PassportService } from './passport.service';

@Module({
  imports: [TypeOrmModule.forFeature([Passport, LedgerEntry])],
  providers: [PassportService],
  exports: [PassportService, TypeOrmModule],
})
export class PassportModule {}
