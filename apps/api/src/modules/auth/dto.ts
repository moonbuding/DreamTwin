import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(6)
  phone!: string;

  @IsOptional()
  @IsString()
  password?: string;
}
