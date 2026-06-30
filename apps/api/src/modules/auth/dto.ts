import { IsObject, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import type { TwinProjection, UserProfile } from '@dreamtwin/api-types';

export class LoginDto {
  @IsString()
  @Matches(/^\d{6,20}$/)
  @MinLength(6)
  phone!: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class RegisterDto {
  @IsString()
  @Matches(/^\d{6,20}$/)
  @MinLength(6)
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  nickname?: string;
}

export class ProfileTwinDto {
  @IsObject()
  profile!: UserProfile;

  @IsObject()
  twin!: TwinProjection;
}
