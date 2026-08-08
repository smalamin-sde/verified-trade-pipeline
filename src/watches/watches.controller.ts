import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateWatchDto } from './dto/create-watch.dto';
import { ListWatchesQueryDto } from './dto/list-watches-query.dto';
import { WatchesService } from './watches.service';

@Controller('watches')
export class WatchesController {
  constructor(private readonly watchesService: WatchesService) {}

  @Roles(Role.SELLER)
  @Post()
  create(
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CreateWatchDto,
  ) {
    return this.watchesService.create(req.user.userId, dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: ListWatchesQueryDto) {
    return this.watchesService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.watchesService.findOne(id);
  }
}
