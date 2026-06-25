import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type {
  RelationshipCounterpartProfile,
  RelationshipSimulationResult,
  UserProfile,
} from '@dreamtwin/api-types';
import { PrismaService } from '../../prisma/prisma.service';
import { getSceneTemplate, type SceneTemplate } from './dream-stories.data';
import { renderCounterpartCard, renderPersonaCard } from './persona-card';

// 「关系预演分析」生成框架(阶段3a)。沿用「梦境相遇」短故事同一套纪律:
// 双卡片驱动、反理想化、不编造、结构化输出、护栏兜底。
// 离线 / 无 ANTHROPIC_API_KEY / 生成失败时,透明回退到固定的保底分析。

const MODEL = process.env.STORY_MODEL ?? 'claude-opus-4-8';

// 阶段2 监管对齐(simulation):与 story 同一个灰度开关,默认关闭。开启后,生成成功的预演分析
// 交由监管模型按两卡片逐条校验 OOC / 编造 / 理想化;不过则带理由重生成一次,重判仍不过则回落固定保底。
const CRITIC_ENABLED = ['on', '1', 'true', 'yes'].includes(
  (process.env.REHEARSAL_CRITIC ?? '').trim().toLowerCase(),
);

// 保底分析(端口自原 content.controller 的 DEFAULT_RESULT)。safetyHint 同时作为不可改写的安全声明。
const FIXED_RESULT: RelationshipSimulationResult = {
  conclusion: '这段关系适合从一个具体、轻、不逼迫的共同情境开始。',
  attractionScore: 72,
  paceScore: 58,
  riskScore: 36,
  likelyDialogue: [
    '你们会先从场景里的一个小选择聊起,而不是直接聊关系定义。',
    '对方会观察你是否尊重边界,也会用轻松回应确认安全感。',
  ],
  behaviorPreview: [
    '你的分身会先给出一个低压邀请,把选择权留给对方。',
    '对方如果愿意继续,会用追问或补充细节释放推进信号。',
  ],
  relationshipTrajectory: ['第一阶段建立共同语境。', '第二阶段通过具体行动确认舒适度。', '第三阶段再进入真实聊天或线下邀约。'],
  romancePossibility: '存在升温可能,但需要通过稳定互动而不是强表白推动。',
  conflictRisk: '如果过早要求明确回应,对方可能把关系推进误读为压力。',
  badOutcomeScenario: '双方都保持礼貌,但没有人给出下一步,关系停在一次短暂体验。',
  suggestedMove: '先提出一个共享的小行动,再观察对方是否愿意补充细节。',
  possibleFirstLine: '这个场景有点像我们会遇到的真实小岔路,你会先往哪边走?',
  safetyHint: 'AI 只提供预演和建议,不代表对方真实承诺,也不会替用户发送消息。',
};

// 结构化输出 schema。safetyHint 不交给模型生成(由服务强制写入,避免安全声明被改写/弱化)。
const SIMULATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    conclusion: { type: 'string' },
    attractionScore: { type: 'integer', minimum: 0, maximum: 100 },
    paceScore: { type: 'integer', minimum: 0, maximum: 100 },
    riskScore: { type: 'integer', minimum: 0, maximum: 100 },
    likelyDialogue: { type: 'array', items: { type: 'string' } },
    behaviorPreview: { type: 'array', items: { type: 'string' } },
    relationshipTrajectory: { type: 'array', items: { type: 'string' } },
    romancePossibility: { type: 'string' },
    conflictRisk: { type: 'string' },
    badOutcomeScenario: { type: 'string' },
    suggestedMove: { type: 'string' },
    possibleFirstLine: { type: 'string' },
  },
  required: [
    'conclusion',
    'attractionScore',
    'paceScore',
    'riskScore',
    'likelyDialogue',
    'behaviorPreview',
    'relationshipTrajectory',
    'romancePossibility',
    'conflictRisk',
    'badOutcomeScenario',
    'suggestedMove',
    'possibleFirstLine',
  ],
} as const;

export const SYSTEM_PROMPT = `你是 DreamTwin 的「关系预演分析师」。给定一个相遇场景和两位用户「分身」的人格卡片,
输出一份对「两个真人若相处会如何发展」的预判分析。准确性优先,趣味性其次。

铁律:
1. 双卡片驱动:对「你的分身」与「TA」的判断分别由各自卡片驱动;契合/摩擦要落到卡片里的具体特质(性格底色/依恋/价值观/红线/冲突风格/爱的语言),而不是泛泛而谈。
2. 反理想化:不要把关系预测得过分美好。真实关系有摩擦、误读、节奏差、依恋错配;conflictRisk / badOutcomeScenario 要写出真实可能的坏走向,不是走过场。
3. 概率性 + 校准:三项分数(0–100)是概率性评估;卡片信息薄时回退人群基准率、给保守分数,并在文字里表达不确定,绝不自信地编。
4. 不编造现实事实:卡片没写的不当既定事实(不出现「上次/记得你/昨天」);「TA」无资料时按基准率与留白处理,不虚构来历。
5. 双人动力学视角:用相似性/互补性定位契合与摩擦,用依恋配对(焦虑×回避=追逃)、冲突风格、投入/承诺判断走向。
6. 低风险、观察非判决:relationshipTrajectory 是阶段性观察而非命运判决;suggestedMove / possibleFirstLine 是可亲自尝试的轻动作,绝不替用户承诺或代发消息,不取真名(只用「你的分身」「TA」)。

字段含义:
- conclusion:一句话总览这段关系的打开方式。
- attractionScore/paceScore/riskScore:吸引力 / 推进节奏(越高越快)/ 风险(越高越需谨慎),0–100。
- likelyDialogue / behaviorPreview:相处时可能出现的对话与行为(各 2–3 条)。
- relationshipTrajectory:分阶段走向(2–4 条)。
- romancePossibility / conflictRisk / badOutcomeScenario:升温可能 / 冲突风险 / 最可能的坏结局。
- suggestedMove / possibleFirstLine:建议的下一步 / 一句可发的开场白。
只输出符合 schema 的 JSON。`;

// 监管模型的结构化输出 schema:整段是否通过 + 逐条问题(出问题的字段名 / 类型 / 归属 / 理由)。
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
          field: { type: 'string' },
          type: { type: 'string', enum: ['ooc', 'violation', 'idealized'] },
          who: { type: 'string', enum: ['you', 'ta', 'both'] },
          reason: { type: 'string' },
        },
        required: ['field', 'type', 'who', 'reason'],
      },
    },
  },
  required: ['ok', 'issues'],
} as const;

const CRITIC_SYSTEM_PROMPT = `你是 DreamTwin 的「关系预演监管/校验模型」。给定一份「关系预演分析」(两人若相处会如何发展)
及「你的分身」「梦中人」两张人格卡片,逐条判断这份分析是否真实可信、忠于人设、不越界。准确性优先:宁可判不过重写,也不要放过失真。

判定维度(每条问题归到其一):
- ooc(人设不符):某项判断/预测无法从对应卡片(性格底色/依恋/价值观/红线/冲突风格)合理推出,或与之矛盾。
- violation(触红线/编造):编造卡片未写的现实既定事实(出现「上次/记得你/昨天」式往事)、触碰红线/dealbreaker,或越过「低风险、观察非判决、不替用户承诺、不取真名」的安全边界(尤其 possibleFirstLine / suggestedMove)。
- idealized(理想化失真):把关系预测得过分美好——「注定/命中注定」式判决、零摩擦、超人设的乐观;真实分析必须含真实的摩擦与坏走向。

铁律(避免误杀):
1. 卡片留白即未知:卡片没写到的维度不得据此判 ooc;「梦中人」卡片整体为空时其留白合规,绝不因此报问题。
2. 只标明确问题:能从卡片合理推出、属于真人概率范围内的,一律放过(ok=true、issues 为空数组)。
3. field 用出问题的字段名(conclusion/likelyDialogue/behaviorPreview/relationshipTrajectory/romancePossibility/conflictRisk/badOutcomeScenario/suggestedMove/possibleFirstLine);who ∈ you/ta/both;reason 一句话点明「卡片里的哪一点 ↔ 哪个字段」冲突。
只输出符合 schema 的 JSON。`;

// 监管校验结果(内部编排契约;预演为字段化,故用 field 而非 frame)。
interface CritiqueIssue {
  field: string;
  type: 'ooc' | 'violation' | 'idealized';
  who: 'you' | 'ta' | 'both';
  reason: string;
}

interface CritiqueResult {
  ok: boolean;
  issues: CritiqueIssue[];
}

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);
  private readonly client: Anthropic | null;

  constructor(private readonly prisma: PrismaService) {
    this.client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  }

  async getSimulation(
    nodeId: string,
    userId: string | null,
    // 「梦中人」卡片接缝:与 story.service 同形;匹配/预演数据层打通(阶段3b)后由调用方传入。
    // 暂未打通时为 undefined,TA 按基准率与留白处理、不虚构。
    counterpart?: RelationshipCounterpartProfile | null,
  ): Promise<RelationshipSimulationResult> {
    const scene = getSceneTemplate(nodeId);
    const youPersona = await this.loadPersona(userId);
    const taPersona = counterpart ? renderCounterpartCard(counterpart) : '';
    const ai = await this.generate(scene, youPersona, taPersona);
    return ai ?? FIXED_RESULT;
  }

  private async loadPersona(userId: string | null): Promise<string> {
    const profileRow = userId
      ? await this.prisma.profile.findUnique({ where: { userId } })
      : await this.prisma.profile.findFirst();
    const p = (profileRow?.data ?? null) as UserProfile | null;
    if (!p) return '人格信息有限:慢热、真实、温柔。';
    return renderPersonaCard(p);
  }

  // 编排:生成一稿 →(灰度开启时)监管校验 → 不过则带理由重生成一次 → 重判仍不过则回落固定保底。
  private async generate(
    scene: SceneTemplate,
    youPersona: string,
    taPersona: string,
  ): Promise<RelationshipSimulationResult | null> {
    if (!this.client) return null;

    const first = await this.generateOnce(scene, youPersona, taPersona);
    if (!first || !CRITIC_ENABLED) return first;

    const verdict = await this.critique(first, youPersona, taPersona);
    if (!verdict || verdict.ok) return first;

    this.logger.log(`Critic flagged simulation (${verdict.issues.length} issue(s)); regenerating once.`);
    const retry = await this.generateOnce(scene, youPersona, taPersona, verdict.issues);
    if (!retry) return null; // 重写本身失败 → 固定保底兜底。

    const retryVerdict = await this.critique(retry, youPersona, taPersona);
    if (!retryVerdict || retryVerdict.ok) return retry;
    this.logger.warn('Critic still flagged simulation after retry; falling back to fixed.');
    return null;
  }

  // 单次结构化生成。issues 存在时(重生成场景)把监管的逐条理由拼进 userPrompt 末尾。
  private async generateOnce(
    scene: SceneTemplate,
    youPersona: string,
    taPersona: string,
    issues?: CritiqueIssue[],
  ): Promise<RelationshipSimulationResult | null> {
    if (!this.client) return null;
    try {
      const userPrompt = [
        `场景:${scene.title} —— ${scene.mood}`,
        `「你的分身」人格:${youPersona}`,
        taPersona
          ? `「梦中人」人格:${taPersona}`
          : '「梦中人」人格:暂无资料 —— 按基准率与留白处理,给保守评估,不要为 TA 编造既定事实或具体来历。',
        ...(issues?.length ? [this.renderCritiqueFeedback(issues)] : []),
      ].join('\n\n');

      // 与 story.service 一致:adaptive 思考 + 结构化输出,字段未被当前 SDK 类型覆盖,故运行时形态传入。
      const params = {
        model: MODEL,
        max_tokens: 1800,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SIMULATION_SCHEMA } },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      } as unknown as Anthropic.MessageCreateParamsNonStreaming;

      const response = await this.client.messages.create(params);

      if ((response.stop_reason as string) === 'refusal') {
        this.logger.warn('Simulation generation refused; falling back to fixed.');
        return null;
      }
      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') return null;
      const parsed = JSON.parse(textBlock.text) as Partial<RelationshipSimulationResult>;
      return this.sanitize(parsed);
    } catch (error) {
      this.logger.warn(`Simulation generation failed: ${(error as Error).message}; falling back to fixed.`);
      return null;
    }
  }

  // 把监管问题渲染成给重生成用的针对性反馈。
  private renderCritiqueFeedback(issues: CritiqueIssue[]): string {
    const typeLabel: Record<CritiqueIssue['type'], string> = {
      ooc: '人设不符',
      violation: '触红线/编造',
      idealized: '理想化失真',
    };
    const lines = issues.map(
      (i) => `- [${i.field}·${i.who}·${typeLabel[i.type] ?? i.type}]:${i.reason}`,
    );
    return `上一稿被监管打回,请针对性修正后重写(不编造现实事实、含真实摩擦、低风险非判决,保守评估):\n${lines.join('\n')}`;
  }

  // 监管模型:按两张卡片逐条校验已生成的预演分析。失败/异常/拒答返回 null(非阻断)。
  private async critique(
    result: RelationshipSimulationResult,
    youPersona: string,
    taPersona: string,
  ): Promise<CritiqueResult | null> {
    if (!this.client) return null;
    try {
      const userPrompt = [
        `「你的分身」卡片:${youPersona}`,
        taPersona
          ? `「梦中人」卡片:${taPersona}`
          : '「梦中人」卡片:暂无资料 —— TA 的留白是合规的,不要据此报问题。',
        `待审预演分析:\n${JSON.stringify(result)}`,
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
      this.logger.warn(`Simulation critique failed: ${(error as Error).message}; skipping critic.`);
      return null;
    }
  }

  // 校验 AI 输出:分数夹到 0–100、数组去空、关键文字非空;任一缺失则判废用兜底。
  private sanitize(r: Partial<RelationshipSimulationResult>): RelationshipSimulationResult | null {
    const score = (v: unknown): number | null =>
      typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : null;
    const strs = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.trim().length > 0) : [];
    const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

    const attractionScore = score(r.attractionScore);
    const paceScore = score(r.paceScore);
    const riskScore = score(r.riskScore);
    const conclusion = str(r.conclusion);
    const likelyDialogue = strs(r.likelyDialogue);
    const behaviorPreview = strs(r.behaviorPreview);
    const relationshipTrajectory = strs(r.relationshipTrajectory);
    const romancePossibility = str(r.romancePossibility);
    const conflictRisk = str(r.conflictRisk);
    const badOutcomeScenario = str(r.badOutcomeScenario);
    const suggestedMove = str(r.suggestedMove);
    const possibleFirstLine = str(r.possibleFirstLine);

    if (
      attractionScore === null ||
      paceScore === null ||
      riskScore === null ||
      !conclusion ||
      !likelyDialogue.length ||
      !behaviorPreview.length ||
      !relationshipTrajectory.length ||
      !romancePossibility ||
      !conflictRisk ||
      !badOutcomeScenario ||
      !suggestedMove ||
      !possibleFirstLine
    ) {
      return null;
    }

    return {
      conclusion,
      attractionScore,
      paceScore,
      riskScore,
      likelyDialogue,
      behaviorPreview,
      relationshipTrajectory,
      romancePossibility,
      conflictRisk,
      badOutcomeScenario,
      suggestedMove,
      possibleFirstLine,
      safetyHint: FIXED_RESULT.safetyHint, // 安全声明固定、不可由模型改写
    };
  }
}
