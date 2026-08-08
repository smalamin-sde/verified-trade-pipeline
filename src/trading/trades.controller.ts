import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthenticationVerdictDto } from '../authentication/dto/authentication-verdict.dto';
import { CreateTradeDto } from './dto/create-trade.dto';
import { TradeTransitionService } from './trade-transition.service';

@Controller('trades')
export class TradesController {
  constructor(private readonly tradeTransitionService: TradeTransitionService) {}

  @Roles(Role.BUYER)
  @Post()
  create(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CreateTradeDto,
  ) {
    return this.tradeTransitionService.createTrade(req.user.userId, dto.watchId);
  }

  @Roles(Role.SELLER)
  @Post(':id/submit-for-auth')
  submitForAuth(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
  ) {
    return this.tradeTransitionService.submitForAuth(id, req.user.userId);
  }

  @Roles(Role.AUTHENTICATOR)
  @Post(':id/authentication-verdict')
  recordAuthenticationVerdict(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body() dto: AuthenticationVerdictDto,
  ) {
    return this.tradeTransitionService.recordAuthenticationVerdict(
      id,
      req.user.userId,
      dto,
    );
  }
}
