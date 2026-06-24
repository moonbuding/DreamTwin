import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { DreamStory, PlazaProfile, RelationshipSimulationResult } from '@dreamtwin/api-types';
import { OptionalJwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { StoryService } from './story.service';

const PLAZA: PlazaProfile[] = [
  { id: 'plaza-yuzi', name: '玻璃橘子', tagline: '习惯把真实需求藏在玩笑后面', keywords: ['细腻', '夜行', '影像'], colorPalette: ['#7ad7ff', '#a98bff', '#ff8fd0'], presence: '在线' },
  { id: 'plaza-nanqiao', name: '南乔', tagline: '想认真聊一聊但不爱寒暄', keywords: ['慢热', '阅读', '城市漫步'], colorPalette: ['#9be7c4', '#6fd3ff', '#b3a4ff'], presence: '1h前' },
  { id: 'plaza-haichao', name: '海潮收音机', tagline: '用隐喻表达情绪,慢慢确认同频', keywords: ['松弛', '电台', '海边'], colorPalette: ['#ffc28a', '#ff8fb8', '#a98bff'], presence: '在线' },
  { id: 'plaza-qingyan', name: '清砚', tagline: '清醒、重视边界,先理解再靠近', keywords: ['清醒', '安全感', '纸杯留言'], colorPalette: ['#8fb8ff', '#6fd3ff', '#9be7c4'], presence: '3h前' },
  { id: 'plaza-xingtu', name: '星图收集者', tagline: '喜欢在深夜交换一个真实的瞬间', keywords: ['好奇', '星空', '独立音乐'], colorPalette: ['#b3a4ff', '#7ad7ff', '#ff9ce0'], presence: '昨天' },
];

const DEFAULT_RESULT: RelationshipSimulationResult = {
  conclusion: '这段关系适合从一个具体、轻、不逼迫的共同情境开始。',
  attractionScore: 72,
  paceScore: 58,
  riskScore: 36,
  likelyDialogue: [
    '你们会先从场景里的一个小选择聊起,而不是直接聊关系定义。',
    '对方会观察你是否尊重边界,也会用轻松回应确认安全感。',
  ],
  behaviorPreview: ['你的分身会先给出一个低压邀请,把选择权留给对方。', '对方如果愿意继续,会用追问或补充细节释放推进信号。'],
  relationshipTrajectory: ['第一阶段建立共同语境。', '第二阶段通过具体行动确认舒适度。', '第三阶段再进入真实聊天或线下邀约。'],
  romancePossibility: '存在升温可能,但需要通过稳定互动而不是强表白推动。',
  conflictRisk: '如果过早要求明确回应,对方可能把关系推进误读为压力。',
  badOutcomeScenario: '双方都保持礼貌,但没有人给出下一步,关系停在一次短暂体验。',
  suggestedMove: '先提出一个共享的小行动,再观察对方是否愿意补充细节。',
  possibleFirstLine: '这个场景有点像我们会遇到的真实小岔路,你会先往哪边走?',
  safetyHint: 'AI 只提供预演和建议,不代表对方真实承诺,也不会替用户发送消息。',
};

@ApiTags('content')
@Controller()
export class ContentController {
  constructor(private readonly storyService: StoryService) {}

  @Get('plaza')
  plaza(): PlazaProfile[] {
    return PLAZA;
  }

  @Get('simulation/:nodeId')
  simulation(@Param('nodeId') _nodeId: string): RelationshipSimulationResult {
    return DEFAULT_RESULT;
  }

  // 「梦境相遇」短故事:按登录用户的分身人格生成;无 key / 失败时回退固定脚本。
  @Get('story/:nodeId')
  @UseGuards(OptionalJwtAuthGuard)
  story(@Param('nodeId') nodeId: string, @CurrentUser() user?: AuthenticatedUser | null): Promise<DreamStory> {
    return this.storyService.getStory(nodeId, user?.id ?? null);
  }
}
