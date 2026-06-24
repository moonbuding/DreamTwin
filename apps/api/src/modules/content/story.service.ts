import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type { DreamStory, StoryFrame, UserProfile } from '@dreamtwin/api-types';
import { PrismaService } from '../../prisma/prisma.service';
import { getFixedStory, getSceneTemplate, type SceneTemplate } from './dream-stories.data';

// 「梦境相遇」生成框架(v0.1)。骨架固定、AI 只填血肉、护栏兜底。
// 离线 / 无 ANTHROPIC_API_KEY / 生成失败时,透明回退到固定脚本。

const MODEL = process.env.STORY_MODEL ?? 'claude-opus-4-8';

// 结构化输出 schema:逐帧 JSON,字段全列出(未用到的填空串),避免 strict 模式踩坑。
const STORY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    frames: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          visual: { type: 'string', enum: ['scene', 'you', 'ta', 'prop', 'turn', 'freeze', 'reading'] },
          icon: { type: 'string' },
          text: { type: 'string' },
          youLine: { type: 'string' },
          taLine: { type: 'string' },
          read: { type: 'string' },
          opener: { type: 'string' },
        },
        required: ['visual', 'icon', 'text', 'youLine', 'taLine', 'read', 'opener'],
      },
    },
  },
  required: ['frames'],
} as const;

const SYSTEM_PROMPT = `你是 DreamTwin 的「梦境编剧」。给定一个固定的梦境场景骨架和用户「分身」的人格,
写一部 7 帧的图文短故事:两个分身(「你的分身」与「梦中人」)在这个场景里相遇,最后一帧给出关系预言。

铁律:
1. 骨架固定:严格 7 帧,visual 依次为 scene/you/ta/prop/turn/freeze/reading,不增删、不改顺序。
2. 字少:每帧 text ≤ 40 字;turn 帧给 youLine 和/或 taLine(每句 ≤ 25 字);reading 帧给 read(≤ 60 字)+ opener(一句可发的开场白,≤ 30 字)。
3. 用人格驱动剧情:把人格写进动作、选择、语气,而不是直接说出 MBTI。
4. 轻、观察式、低风险。绝不写「注定/命中注定/你们会相爱」式预言;reading 是观察 + 建议,不是判决。
5. 不编造任何现实事实(不出现「上次/记得你/昨天」等);两个角色只用「你的分身」「TA」,不取真名。
6. 每帧只填该帧用到的字段,其余字段填空字符串 ""。scene/prop/freeze 帧可给一个 Feather 图标名(icon),如 cloud-rain/umbrella/moon/radio/wind/sunrise/droplet/volume-2/edit-3。
只输出符合 schema 的 JSON。`;

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);
  private readonly client: Anthropic | null;

  constructor(private readonly prisma: PrismaService) {
    this.client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  }

  async getStory(nodeId: string, userId: string | null): Promise<DreamStory> {
    const scene = getSceneTemplate(nodeId);
    const persona = await this.loadPersona(userId);
    const ai = await this.generate(scene, persona);
    return ai ?? getFixedStory(nodeId);
  }

  private async loadPersona(userId: string | null): Promise<string> {
    const profileRow = userId
      ? await this.prisma.profile.findUnique({ where: { userId } })
      : await this.prisma.profile.findFirst();
    const p = (profileRow?.data ?? null) as UserProfile | null;
    if (!p) return '人格信息有限:慢热、真实、温柔。';
    const parts = [
      p.personalityKeywords?.length ? `性格:${p.personalityKeywords.join('、')}` : '',
      p.mbti ? `MBTI:${p.mbti}` : '',
      p.communicationStyle ? `沟通:${p.communicationStyle}` : '',
      p.values?.length ? `价值观:${p.values.join('、')}` : '',
      p.mysticTags?.length ? `叙事信号:${p.mysticTags.join('、')}` : '',
    ].filter(Boolean);
    return parts.length ? parts.join(';') : '人格信息有限:慢热、真实、温柔。';
  }

  private async generate(scene: SceneTemplate, persona: string): Promise<DreamStory | null> {
    if (!this.client) return null;
    try {
      const fewShot = JSON.stringify({ frames: getFixedStory(scene.sceneId).frames });
      const userPrompt = [
        `场景:${scene.title} —— ${scene.mood}`,
        `节拍骨架(逐帧):\n${scene.beats.map((b, i) => `${i + 1}. ${b}`).join('\n')}`,
        `「你的分身」人格:${persona}`,
        `参考(同场景固定脚本的风格与密度,你要按上面的人格重写,不要照抄):\n${fewShot}`,
      ].join('\n\n');

      // 用 adaptive 思考 + 结构化输出。output_config / adaptive 是较新的 API 字段,
      // 这里的 SDK 版本类型未覆盖,故以非流式参数形态传入(运行时字段有效)。
      const params = {
        model: MODEL,
        max_tokens: 2000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low', format: { type: 'json_schema', schema: STORY_SCHEMA } },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      } as unknown as Anthropic.MessageCreateParamsNonStreaming;

      const response = await this.client.messages.create(params);

      if ((response.stop_reason as string) === 'refusal') {
        this.logger.warn('Story generation refused; falling back to fixed.');
        return null;
      }
      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') return null;
      const parsed = JSON.parse(textBlock.text) as { frames?: StoryFrame[] };
      const frames = this.sanitizeFrames(parsed.frames);
      if (!frames) return null;
      return { sceneId: scene.sceneId, title: scene.title, theme: scene.theme, frames, source: 'ai' };
    } catch (error) {
      this.logger.warn(`Story generation failed: ${(error as Error).message}; falling back to fixed.`);
      return null;
    }
  }

  // 校验 AI 输出的骨架:必须正好 7 帧且 visual 顺序正确,否则判废用兜底。
  private sanitizeFrames(frames: StoryFrame[] | undefined): StoryFrame[] | null {
    const order = ['scene', 'you', 'ta', 'prop', 'turn', 'freeze', 'reading'];
    if (!Array.isArray(frames) || frames.length !== order.length) return null;
    if (!frames.every((f, i) => f?.visual === order[i])) return null;
    // 去掉空字符串字段,保持和固定脚本一致的"只带用到的字段"形态。
    return frames.map((f) => {
      const clean: StoryFrame = { visual: f.visual };
      (['icon', 'text', 'youLine', 'taLine', 'read', 'opener'] as const).forEach((k) => {
        const v = f[k];
        if (typeof v === 'string' && v.trim()) clean[k] = v;
      });
      return clean;
    });
  }
}
