import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '../authentication/authentication.module';
import { EscrowModule } from '../escrow/escrow.module';
import { PassportModule } from '../passport/passport.module';
import { Watch } from '../watches/entities/watch.entity';
import { Trade } from './entities/trade.entity';
import { TradeTransitionService } from './trade-transition.service';
import { TradesController } from './trades.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trade, Watch]),
    PassportModule,
    AuthenticationModule,
    EscrowModule,
  ],
  controllers: [TradesController],
  providers: [TradeTransitionService],
  exports: [TradeTransitionService, TypeOrmModule],
})
export class TradingModule {}
