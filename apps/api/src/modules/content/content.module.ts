import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentController } from './content.controller';
import { StoryService } from './story.service';
import { SimulationService } from './simulation.service';
import { CounterpartService } from './counterpart.service';

@Module({
  imports: [AuthModule],
  controllers: [ContentController],
  providers: [StoryService, SimulationService, CounterpartService],
})
export class ContentModule {}
