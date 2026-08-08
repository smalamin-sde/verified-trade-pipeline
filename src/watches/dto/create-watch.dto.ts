import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { WatchCondition } from '../enums/watch-condition.enum';

export class CreateWatchDto {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  referenceNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(64)
  serialNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(64)
  brand!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(128)
  model!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  askingPrice!: number;

  @IsEnum(WatchCondition)
  condition!: WatchCondition;

  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  photos!: string[];
}
