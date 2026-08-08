import { IsString, MinLength } from 'class-validator';

export class MarkShippedDto {
  @IsString()
  @MinLength(3)
  trackingNumber!: string;
}
