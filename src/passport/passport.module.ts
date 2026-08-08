import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Passport } from './entities/passport.entity';
import { PassportController } from './passport.controller';
import { PassportService } from './passport.service';

@Module({
  imports: [TypeOrmModule.forFeature([Passport, LedgerEntry])],
  controllers: [PassportController],
  providers: [PassportService],
  exports: [PassportService, TypeOrmModule],
})
export class PassportModule {}
