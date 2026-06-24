import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from './auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [JwtService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
