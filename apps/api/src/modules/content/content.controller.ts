import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { DreamStory, PlazaProfile, RelationshipSimulationResult } from '@dreamtwin/api-types';
import { OptionalJwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { StoryService } from './story.service';
import { SimulationService } from './simulation.service';
import { CounterpartService } from './counterpart.service';
import { PLAZA_PROFILES } from './plaza.data';

@ApiTags('content')
@Controller()
export class ContentController {
  constructor(
    private readonly storyService: StoryService,
    private readonly simulationService: SimulationService,
    private readonly counterpartService: CounterpartService,
  ) {}

  @Get('plaza')
  plaza(): PlazaProfile[] {
    return PLAZA_PROFILES;
  }

  // 关系预演分析:按登录用户分身 + 解析到的「梦中人」卡片 AI 生成;无 key / 失败时回退固定保底分析。
  @Get('simulation/:nodeId')
  @UseGuards(OptionalJwtAuthGuard)
  async simulation(
    @Param('nodeId') nodeId: string,
    @CurrentUser() user?: AuthenticatedUser | null,
  ): Promise<RelationshipSimulationResult> {
    const userId = user?.id ?? null;
    const counterpart = await this.counterpartService.resolveForNode(nodeId, userId);
    return this.simulationService.getSimulation(nodeId, userId, counterpart);
  }

  // 「梦境相遇」短故事:按登录用户分身 + 解析到的「梦中人」卡片生成;无 key / 失败时回退固定脚本。
  @Get('story/:nodeId')
  @UseGuards(OptionalJwtAuthGuard)
  async story(
    @Param('nodeId') nodeId: string,
    @CurrentUser() user?: AuthenticatedUser | null,
  ): Promise<DreamStory> {
    const userId = user?.id ?? null;
    const counterpart = await this.counterpartService.resolveForNode(nodeId, userId);
    return this.storyService.getStory(nodeId, userId, counterpart);
  }
}
