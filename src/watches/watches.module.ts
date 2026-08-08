import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '../passport/passport.module';
import { Watch } from './entities/watch.entity';
import { WatchesController } from './watches.controller';
import { WatchesService } from './watches.service';

@Module({
  imports: [TypeOrmModule.forFeature([Watch]), PassportModule],
  controllers: [WatchesController],
  providers: [WatchesService],
  exports: [WatchesService, TypeOrmModule],
})
export class WatchesModule {}
