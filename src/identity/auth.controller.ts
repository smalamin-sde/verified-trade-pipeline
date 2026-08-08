import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  me(@Req() req: { user: AuthenticatedUser }) {
    return req.user;
  }

  @Get('seller-check')
  @Roles(Role.SELLER)
  sellerCheck() {
    return { ok: true, message: 'Seller access granted' };
  }
}
