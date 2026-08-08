import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthenticationVerdictDto } from '../authentication/dto/authentication-verdict.dto';
import { EscrowService } from '../escrow/escrow.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { DisputeDto } from './dto/dispute.dto';
import { MarkShippedDto } from './dto/mark-shipped.dto';
import { TradeTransitionService } from './trade-transition.service';
import { TradeQueryService } from './trade-query.service';

@Controller('trades')
export class TradesController {
  constructor(
    private readonly tradeTransitionService: TradeTransitionService,
    private readonly escrowService: EscrowService,
    private readonly tradeQueryService: TradeQueryService,
  ) {}

  @Roles(Role.BUYER, Role.SELLER)
  @Get(':id')
  getTrade(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
  ) {
    return this.tradeQueryService.getTradeProjection(id, req.user.userId);
  }

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

  @Roles(Role.BUYER)
  @Post(':id/fund-escrow')
  fundEscrow(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: Record<string, unknown> = {},
  ) {
    return this.escrowService.fundEscrow(
      id,
      req.user.userId,
      idempotencyKey,
      body ?? {},
    );
  }

  @Roles(Role.SELLER)
  @Post(':id/mark-shipped')
  markShipped(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body() dto: MarkShippedDto,
  ) {
    return this.tradeTransitionService.markShipped(id, req.user.userId, dto);
  }

  @Public()
  @Post(':id/mark-delivered')
  markDelivered(@Param('id') id: string) {
    return this.tradeTransitionService.markDelivered(id);
  }

  @Roles(Role.BUYER)
  @Post(':id/release')
  release(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
  ) {
    return this.tradeTransitionService.release(id, req.user.userId);
  }

  @Roles(Role.BUYER)
  @Post(':id/dispute')
  dispute(
    @Req() req: { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body() dto: DisputeDto,
  ) {
    return this.tradeTransitionService.dispute(id, req.user.userId, dto);
  }
}
