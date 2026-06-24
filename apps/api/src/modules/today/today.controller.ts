import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { TodayService } from './today.service';

@ApiTags('today')
@Controller('today')
export class TodayController {
  constructor(private readonly today: TodayService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getToday(@CurrentUser() user?: AuthenticatedUser | null) {
    return this.today.getToday(user?.id ?? null);
  }
}
