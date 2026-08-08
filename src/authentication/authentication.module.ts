import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationReport } from './entities/authentication-report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuthenticationReport])],
  exports: [TypeOrmModule],
})
export class AuthenticationModule {}
