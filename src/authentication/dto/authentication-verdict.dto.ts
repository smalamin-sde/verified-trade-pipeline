import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AuthVerdict } from '../enums/auth-verdict.enum';

export class AuthenticationVerdictDto {
  @IsEnum(AuthVerdict)
  verdict!: AuthVerdict;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoHashes?: string[];
}
