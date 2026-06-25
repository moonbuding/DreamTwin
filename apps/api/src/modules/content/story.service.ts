import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type {
  DreamStory,
  RelationshipCounterpartProfile,
  StoryFrame,
  UserProfile,
} from '@dreamtwin/api-types';
import { PrismaService } from '../../prisma/prisma.service';
import { getFixedStory, getSceneTemplate, type SceneTemplate } from './dream-stories.data';
import { renderCounterpartCard, renderPersonaCard } from './persona-card';

// 「梦境相遇」生成框架(v0.1)。骨架固定、AI 只填血肉、护栏兜底。
// 离线 / 无 ANTHROPIC_API_KEY / 生成失败时,透明回退到固定脚本。

const MODEL = process.env.STORY_MODEL ?? 'claude-opus-4-8';

// 阶段2 监管/校验闭环:灰度开关,默认关闭(控成本/延迟)。开启后,生成成功的故事交由
// 「监管模型」按两张卡片逐条校验 OOC / 触红线 / 理想化失真;不过则带理由重生成一次(最多 1 次),
// 重判仍不过则回落固定脚本。任一步的 critic 调用异常都不阻断,沿用已生成稿。
const CRITIC_ENABLED = ['on', '1', 'true', 'yes'].includes(
  (process.env.REHEARSAL_CRITIC ?? '').trim().toLowerCase(),
);

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

// 监管模型的结构化输出 schema:整段是否通过 + 逐条问题(帧号 1–7 / 类型 / 归属 / 理由)。
const CRITIQUE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ok: { type: 'boolean' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          frame: { type: 'integer', minimum: 1, maximum: 7 },
          type: { type: 'string', enum: ['ooc', 'violation', 'idealized'] },
          who: { type: 'string', enum: ['you', 'ta'] },
          reason: { type: 'string' },
        },
        required: ['frame', 'type', 'who', 'reason'],
      },
    },
  },
  required: ['ok', 'issues'],
} as const;

export const SYSTEM_PROMPT = `你是 DreamTwin 的「梦境编剧」。给定一个固定的梦境场景骨架和用户「分身」的人格,
写一部 7 帧的图文短故事:两个分身(「你的分身」与「梦中人」)在这个场景里相遇,最后一帧给出关系预言。

铁律:
1. 骨架固定:严格 7 帧,visual 依次为 scene/you/ta/prop/turn/freeze/reading,不增删、不改顺序。
2. 字少:每帧 text ≤ 40 字;turn 帧给 youLine 和/或 taLine(每句 ≤ 25 字);reading 帧给 read(≤ 60 字)+ opener(一句可发的开场白,≤ 30 字)。
3. 双卡片驱动:you 帧与 turn 帧里「你的分身」的动作/台词由「你的分身」人格驱动,ta 帧与 turn 帧里「TA」的动作/台词由「梦中人」人格驱动;把人格写进动作、选择、语气,而不是直接说出 MBTI。
4. 真实优先于体面:两人都不是完人,允许迟疑、防御、误读、不够圆滑的小瞬间(比句句得体更可信)。但仍保持轻、观察式、低风险;绝不写「注定/命中注定/你们会相爱」式预言;reading 是观察 + 建议,不是判决。
5. 不编造现实事实:卡片没写到的不要当成既定事实(不出现「上次/记得你/昨天」等),可表现为不确定/留白;两个角色只用「你的分身」「TA」,不取真名。
6. 每帧只填该帧用到的字段,其余字段填空字符串 ""。scene/prop/freeze 帧可给一个 Feather 图标名(icon),如 cloud-rain/umbrella/moon/radio/wind/sunrise/droplet/volume-2/edit-3。
7. 参考脚本只用于对标风格/密度/字数,严禁照抄:不得逐字或整帧复制参考脚本里的任何句子;每一帧的文案、动作、道具细节、台词都要按这两人的卡片重新写。哪怕场景主题与参考相近,也要换成属于这两个具体的人的动作与台词——若发现自己在复制参考句,立即改写。
只输出符合 schema 的 JSON。`;

// 阶段2 监管模型(导演兼审片):按两张卡片逐帧判 OOC / 触红线 / 理想化失真,准确性优先。
export const CRITIC_SYSTEM_PROMPT = `你是 DreamTwin 的「监管/校验模型」(关系预演的导演兼审片)。给定固定 7 帧的「梦境相遇」短故事,
以及「你的分身」「梦中人」两张人格卡片,逐帧判断这段对戏是否真实可信、是否忠于两人人设。
准确性优先:宁可判不过重写,也不要放过失真。

判定维度(每条问题归到其一):
- ooc(人设不符):某帧里「你的分身」或「TA」的动作/选择/台词,无法从其卡片(性格底色/依恋/价值观/红线/if-then/语气样本)合理推出,或与之矛盾。
- violation(触红线):任一方的言行触碰对方卡片写明的红线/dealbreaker,或越过「低风险、观察非判决、不取真名、不编造现实事实(不出现『上次/记得你/昨天』)」的安全边界。
- idealized(理想化失真):把人演得过分善解人意/体面/默契——超人设的「金句」、不像真人会说的话、零摩擦的完美互动。真实的人允许迟疑、防御、误读、不够圆滑,这些不是问题;过度完美才是问题。

铁律(避免误杀):
1. 卡片留白即未知:卡片没写到的维度不得据此判 ooc,也不得要求补全;「梦中人」卡片整体为空时,TA 的轻描淡写与留白是合规的,绝不因此报问题。
2. 只标明确问题:能从卡片合理推出的、属于真人正常不完美范围的,一律放过(ok=true、issues 为空数组)。
3. 不评价骨架与字数:帧数/visual 顺序/字数另有程序校验,你只看人设保真与互动真实。
4. frame 用 1–7 的帧序号;who 标问题归属的一方(you/ta);reason 一句话点明「卡片里的哪一点 ↔ 哪一帧的什么」冲突。
只输出符合 schema 的 JSON。`;

// 监管校验结果(内部编排契约,见技术文档 §4 的 CritiqueResult 草案;不入 api-types 公共契约)。
interface CritiqueIssue {
  frame: number; // 帧序号 1–7
  type: 'ooc' | 'violation' | 'idealized';
  who: 'you' | 'ta';
  reason: string;
}

interface CritiqueResult {
  ok: boolean;
  issues: CritiqueIssue[];
}

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);
  private readonly client: Anthropic | null;

  constructor(private readonly prisma: PrismaService) {
    this.client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  }

  async getStory(
    nodeId: string,
    userId: string | null,
    // 「梦中人」卡片接缝:匹配/预演数据层打通后由调用方传入;
    // 暂未打通时为 undefined,TA 按铁律保持留白、不虚构。
    counterpart?: RelationshipCounterpartProfile | null,
  ): Promise<DreamStory> {
    const scene = getSceneTemplate(nodeId);
    const youPersona = await this.loadPersona(userId);
    const taPersona = counterpart ? renderCounterpartCard(counterpart) : '';
    const ai = await this.generate(scene, youPersona, taPersona);
    return ai ?? getFixedStory(nodeId);
  }

  private async loadPersona(userId: string | null): Promise<string> {
    const profileRow = userId
      ? await this.prisma.profile.findUnique({ where: { userId } })
      : await this.prisma.profile.findFirst();
    const p = (profileRow?.data ?? null) as UserProfile | null;
    if (!p) return '人格信息有限:慢热、真实、温柔。';
    return renderPersonaCard(p);
  }

  // 编排:生成一稿 →(灰度开启时)监管校验 → 不过则带理由重生成一次 → 重判仍不过则回落固定脚本。
  // critic 关闭、或 critic 调用本身异常时,行为退化为阶段0/1(单次生成 + 兜底),不降低可用性。
  private async generate(
    scene: SceneTemplate,
    youPersona: string,
    taPersona: string,
  ): Promise<DreamStory | null> {
    if (!this.client) return null;

    const first = await this.generateOnce(scene, youPersona, taPersona);
    if (!first || !CRITIC_ENABLED) return first;

    const verdict = await this.critique(first.frames, youPersona, taPersona);
    // critic 不可用/异常(null)或判过 → 直接采用首稿。
    if (!verdict || verdict.ok) return first;

    // 被打回:带逐条理由重生成一次(最多 1 次)。
    this.logger.log(`Critic flagged story (${verdict.issues.length} issue(s)); regenerating once.`);
    const retry = await this.generateOnce(scene, youPersona, taPersona, verdict.issues);
    if (!retry) return null; // 重写本身失败 → 固定脚本兜底。

    const retryVerdict = await this.critique(retry.frames, youPersona, taPersona);
    if (!retryVerdict || retryVerdict.ok) return retry; // 通过(或 critic 异常不阻断)→ 用重写稿。
    this.logger.warn('Critic still flagged story after retry; falling back to fixed.');
    return null; // 重判仍不过 → 固定脚本兜底。
  }

  // 单次结构化生成 7 帧。issues 存在时(重生成场景)把监管的逐条理由拼进 userPrompt 末尾。
  private async generateOnce(
    scene: SceneTemplate,
    youPersona: string,
    taPersona: string,
    issues?: CritiqueIssue[],
  ): Promise<DreamStory | null> {
    if (!this.client) return null;
    try {
      const fewShot = JSON.stringify({ frames: getFixedStory(scene.sceneId).frames });
      const userPrompt = [
        `场景:${scene.title} —— ${scene.mood}`,
        `节拍骨架(逐帧):\n${scene.beats.map((b, i) => `${i + 1}. ${b}`).join('\n')}`,
        `「你的分身」人格:${youPersona}`,
        taPersona
          ? `「梦中人」人格:${taPersona}`
          : '「梦中人」人格:暂无资料 —— 保持轻描淡写与留白,不要为 TA 编造既定事实或具体来历。',
        `仅作风格/密度/字数对标的同场景脚本(严禁照抄,必须逐帧重写成属于这两人的版本):\n${fewShot}`,
        ...(issues?.length ? [this.renderCritiqueFeedback(issues)] : []),
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

  // 把监管问题渲染成给重生成用的针对性反馈(中文、逐条、点名帧号与归属)。
  private renderCritiqueFeedback(issues: CritiqueIssue[]): string {
    const typeLabel: Record<CritiqueIssue['type'], string> = {
      ooc: '人设不符',
      violation: '触红线',
      idealized: '理想化失真',
    };
    const lines = issues.map(
      (i) =>
        `- 第${i.frame}帧[${i.who === 'you' ? '你的分身' : 'TA'}·${typeLabel[i.type] ?? i.type}]:${i.reason}`,
    );
    return `上一稿被监管打回,请针对性修正后重写(保持 7 帧骨架/字数/不编造,不要照抄上稿):\n${lines.join('\n')}`;
  }

  // 监管模型:按两张卡片逐条校验已生成的 7 帧。失败/异常/拒答返回 null(非阻断,不降低可用性)。
  private async critique(
    frames: StoryFrame[],
    youPersona: string,
    taPersona: string,
  ): Promise<CritiqueResult | null> {
    if (!this.client) return null;
    try {
      const numbered = frames.map((f, i) => ({ frame: i + 1, ...f }));
      const userPrompt = [
        `「你的分身」卡片:${youPersona}`,
        taPersona
          ? `「梦中人」卡片:${taPersona}`
          : '「梦中人」卡片:暂无资料 —— TA 的留白是合规的,不要据此报问题。',
        `待审 7 帧(已编号 1–7):\n${JSON.stringify({ frames: numbered })}`,
      ].join('\n\n');

      const params = {
        model: MODEL,
        max_tokens: 800,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low', format: { type: 'json_schema', schema: CRITIQUE_SCHEMA } },
        system: CRITIC_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      } as unknown as Anthropic.MessageCreateParamsNonStreaming;

      const response = await this.client.messages.create(params);
      if ((response.stop_reason as string) === 'refusal') return null;
      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') return null;
      const parsed = JSON.parse(textBlock.text) as Partial<CritiqueResult>;
      if (typeof parsed.ok !== 'boolean') return null;
      const issues = Array.isArray(parsed.issues) ? parsed.issues : [];
      return { ok: parsed.ok, issues };
    } catch (error) {
      this.logger.warn(`Story critique failed: ${(error as Error).message}; skipping critic.`);
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
