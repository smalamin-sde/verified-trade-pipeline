import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Watch } from '../watches/entities/watch.entity';
import { Trade } from './entities/trade.entity';
import { TradeTransitionService } from './trade-transition.service';
import { TradesController } from './trades.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Trade, Watch])],
  controllers: [TradesController],
  providers: [TradeTransitionService],
  exports: [TradeTransitionService, TypeOrmModule],
})
export class TradingModule {}
