import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TodayModule } from './modules/today/today.module';
import { ContentModule } from './modules/content/content.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, TodayModule, ContentModule],
  controllers: [HealthController],
})
export class AppModule {}
