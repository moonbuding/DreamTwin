import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentController } from './content.controller';
import { StoryService } from './story.service';

@Module({
  imports: [AuthModule],
  controllers: [ContentController],
  providers: [StoryService],
})
export class ContentModule {}
