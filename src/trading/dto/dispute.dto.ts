import { IsString, MinLength } from 'class-validator';

export class DisputeDto {
  @IsString()
  @MinLength(3)
  disputeReason!: string;
}
