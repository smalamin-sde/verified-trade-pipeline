import { IsUUID } from 'class-validator';

export class CreateTradeDto {
  @IsUUID()
  watchId!: string;
}
