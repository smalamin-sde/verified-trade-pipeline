import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PassportService } from './passport.service';

@Controller('passport')
export class PassportController {
  constructor(private readonly passportService: PassportService) {}

  @Public()
  @Get('by-serial/:serial')
  getBySerial(@Param('serial') serial: string) {
    return this.passportService.getPublicViewBySerial(serial);
  }
}
