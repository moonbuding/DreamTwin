/**
 * 关系预演「双卡片」生成质量冒烟测试(阶段2/3 验证)。
 *
 * 复用生产侧的 SYSTEM_PROMPT / CRITIC_SYSTEM_PROMPT + 卡片渲染器 + 场景骨架 + 对手解析,
 * 改用 DeepSeek 的 OpenAI 兼容接口(JSON 模式)实跑 —— 验证「提示词 + 两张卡片」的生成质量,
 * 以及阶段2 监管闭环(校验 → 带理由重写 → 复判)能否拦下 OOC / 编造 / 理想化。
 * (生产 service 走 Anthropic SDK 专有参数,与此脚本的 provider 无关。)
 *
 * 运行(密钥经环境变量传入,勿写进文件):
 *   DEEPSEEK_API_KEY=sk-xxx pnpm exec tsx scripts/rehearsal-smoke.ts
 *   附带预演分析:SMOKE_SIM=1 DEEPSEEK_API_KEY=sk-xxx pnpm exec tsx scripts/rehearsal-smoke.ts
 */
import { PrismaClient } from '@prisma/client';
import type { RelationshipCounterpartProfile, StoryFrame, UserProfile } from '@dreamtwin/api-types';
import {
  SYSTEM_PROMPT as STORY_SYSTEM,
  CRITIC_SYSTEM_PROMPT as CRITIC_SYSTEM,
} from '../src/modules/content/story.service';
import { SYSTEM_PROMPT as SIM_SYSTEM } from '../src/modules/content/simulation.service';
import { CounterpartService } from '../src/modules/content/counterpart.service';
import { renderCounterpartCard, renderPersonaCard } from '../src/modules/content/persona-card';
import { getFixedStory, getSceneTemplate, type SceneTemplate } from '../src/modules/content/dream-stories.data';

const prisma = new PrismaClient();
const cp = new CounterpartService(prisma as never);

const API = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

type Critique = { ok: boolean; issues: Array<{ frame: number; type: string; who: string; reason: string }> };

async function deepseek(system: string, user: string, temperature: number): Promise<string> {
  const res = await fetch(`${API}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY ?? ''}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? '';
}

// 与生产 story.service.sanitizeFrames 同规则。
function sanitizeFrames(frames: StoryFrame[] | undefined): StoryFrame[] | null {
  const order = ['scene', 'you', 'ta', 'prop', 'turn', 'freeze', 'reading'];
  if (!Array.isArray(frames) || frames.length !== order.length) return null;
  if (!frames.every((f, i) => f?.visual === order[i])) return null;
  return frames.map((f) => {
    const clean: StoryFrame = { visual: f.visual };
    (['icon', 'text', 'youLine', 'taLine', 'read', 'opener'] as const).forEach((k) => {
      const v = f[k];
      if (typeof v === 'string' && v.trim()) clean[k] = v;
    });
    return clean;
  });
}

// 与固定脚本的整帧雷同比例(0–1):验证「反照抄」是否生效。
function copyRatioVsFixed(frames: StoryFrame[], sceneId: string): number {
  const fixed = getFixedStory(sceneId).frames;
  let same = 0;
  frames.forEach((f, i) => {
    if (JSON.stringify(f) === JSON.stringify(fixed[i] ?? {})) same += 1;
  });
  return same / frames.length;
}

function printFrames(frames: StoryFrame[]): void {
  frames.forEach((f, i) => {
    const bits = [
      f.text,
      f.youLine ? `你:${f.youLine}` : '',
      f.taLine ? `TA:${f.taLine}` : '',
      f.read ? `读:${f.read}` : '',
      f.opener ? `开场:${f.opener}` : '',
    ].filter(Boolean);
    console.log(`  ${i + 1}.${f.visual}  ${bits.join('  ')}`);
  });
}

// 复刻生产 generateOnce 的 userPrompt(含反照抄措辞 + 可选监管反馈)。
async function generateStory(
  scene: SceneTemplate,
  youPersona: string,
  taPersona: string,
  feedback?: string,
): Promise<StoryFrame[] | null> {
  const fewShot = JSON.stringify({ frames: getFixedStory(scene.sceneId).frames });
  const user = [
    `场景:${scene.title} —— ${scene.mood}`,
    `节拍骨架(逐帧):\n${scene.beats.map((b, i) => `${i + 1}. ${b}`).join('\n')}`,
    `「你的分身」人格:${youPersona}`,
    taPersona
      ? `「梦中人」人格:${taPersona}`
      : '「梦中人」人格:暂无资料 —— 保持轻描淡写与留白,不要为 TA 编造既定事实或具体来历。',
    `仅作风格/密度/字数对标的同场景脚本(严禁照抄,必须逐帧重写成属于这两人的版本):\n${fewShot}`,
    ...(feedback ? [feedback] : []),
  ].join('\n\n');
  const raw = await deepseek(STORY_SYSTEM, user, 0.85);
  return sanitizeFrames((JSON.parse(raw) as { frames?: StoryFrame[] }).frames);
}

// 复刻生产 critique:按两卡片逐帧判 OOC/编造/理想化。
async function critique(frames: StoryFrame[], youPersona: string, taPersona: string): Promise<Critique | null> {
  const numbered = frames.map((f, i) => ({ frame: i + 1, ...f }));
  const user = [
    `「你的分身」卡片:${youPersona}`,
    taPersona
      ? `「梦中人」卡片:${taPersona}`
      : '「梦中人」卡片:暂无资料 —— TA 的留白是合规的,不要据此报问题。',
    `待审 7 帧(已编号 1–7):\n${JSON.stringify({ frames: numbered })}`,
    '只输出 JSON:{"ok":boolean,"issues":[{"frame":1-7整数,"type":"ooc"|"violation"|"idealized","who":"you"|"ta","reason":string}]}',
  ].join('\n\n');
  const raw = await deepseek(CRITIC_SYSTEM, user, 0.0);
  const parsed = JSON.parse(raw) as Partial<Critique>;
  if (typeof parsed.ok !== 'boolean') return null;
  return { ok: parsed.ok, issues: Array.isArray(parsed.issues) ? parsed.issues : [] };
}

// 复刻生产 renderCritiqueFeedback。
function formatFeedback(issues: Critique['issues']): string {
  const label: Record<string, string> = { ooc: '人设不符', violation: '触红线', idealized: '理想化失真' };
  const lines = issues.map(
    (i) => `- 第${i.frame}帧[${i.who === 'you' ? '你的分身' : 'TA'}·${label[i.type] ?? i.type}]:${i.reason}`,
  );
  return `上一稿被监管打回,请针对性修正后重写(保持 7 帧骨架/字数/不编造,不要照抄上稿):\n${lines.join('\n')}`;
}

function printVerdict(tag: string, v: Critique | null): void {
  if (!v) {
    console.log(`  [${tag}] critic 不可用/解析失败`);
    return;
  }
  console.log(`  [${tag}] ok=${v.ok}${v.issues.length ? ` · ${v.issues.length} 处问题:` : ' · 无问题'}`);
  v.issues.forEach((i) => console.log(`     - 第${i.frame}帧 ${i.type}/${i.who}:${i.reason}`));
}

async function loadYouPersona(): Promise<string> {
  const row = await prisma.profile.findFirst();
  const p = (row?.data ?? null) as UserProfile | null;
  return p ? renderPersonaCard(p) : '人格信息有限:慢热、真实、温柔。';
}

const NODES = ['node-moon-platform', 'node-friend-mika'];

async function run() {
  console.log('--- env ---  MODEL =', MODEL, '| BASE =', API, '| key present =', !!process.env.DEEPSEEK_API_KEY);
  const youPersona = await loadYouPersona();
  console.log('\n「你的分身」(小梦) 卡片:', youPersona);

  // ============ PART A:反照抄 + 真实稿监管闭环 ============
  for (const nodeId of NODES) {
    console.log(`\n==================== ${nodeId} ====================`);
    const scene = getSceneTemplate(nodeId);
    const counterpart = await cp.resolveForNode(nodeId, null);
    const taPersona = counterpart ? renderCounterpartCard(counterpart) : '';
    console.log('场景:', scene.title, '| 「梦中人」:', taPersona || '(留白)');

    const frames = await generateStory(scene, youPersona, taPersona);
    if (!frames) {
      console.log('[STORY] 骨架校验失败,跳过。');
      continue;
    }
    const ratio = copyRatioVsFixed(frames, scene.sceneId);
    console.log(`\n[STORY] 骨架✅ · 与固定脚本整帧雷同率 = ${(ratio * 100).toFixed(0)}% ${ratio >= 0.5 ? '⚠️仍偏照抄' : '✅已重写'}`);
    printFrames(frames);

    const v1 = await critique(frames, youPersona, taPersona);
    printVerdict('critic·首稿', v1);
    if (v1 && !v1.ok) {
      const retry = await generateStory(scene, youPersona, taPersona, formatFeedback(v1.issues));
      if (retry) {
        console.log('  → 带理由重写后:');
        printFrames(retry);
        printVerdict('critic·重写', await critique(retry, youPersona, taPersona));
      }
    }

    if (process.env.SMOKE_SIM) {
      const simUser = [
        `场景:${scene.title} —— ${scene.mood}`,
        `「你的分身」人格:${youPersona}`,
        taPersona
          ? `「梦中人」人格:${taPersona}`
          : '「梦中人」人格:暂无资料 —— 按基准率与留白处理,给保守评估,不要为 TA 编造既定事实或具体来历。',
        '只输出 JSON,字段:{conclusion, attractionScore:0-100, paceScore:0-100, riskScore:0-100, likelyDialogue:[], behaviorPreview:[], relationshipTrajectory:[], romancePossibility, conflictRisk, badOutcomeScenario, suggestedMove, possibleFirstLine}',
      ].join('\n\n');
      const r = JSON.parse(await deepseek(SIM_SYSTEM, simUser, 0.6)) as Record<string, unknown>;
      console.log('\n[SIMULATION] 结论:', r.conclusion, '| 分数:', r.attractionScore, r.paceScore, r.riskScore);
      console.log('  开场白:', r.possibleFirstLine);
    }
  }

  // ============ PART B:确定性「编造/理想化」拦截演示 ============
  console.log('\n\n############ critic 拦截演示:故意编造往事 + 命中注定式判决 ############');
  const scene = getSceneTemplate('node-rain-store');
  const mika = await cp.resolveForNode('node-friend-mika', null);
  const taPersona = mika ? renderCounterpartCard(mika) : '';
  const badFrames: StoryFrame[] = [
    { visual: 'scene', icon: 'cloud-rain', text: '凌晨一点,雨砸在便利店玻璃上。' },
    { visual: 'you', text: '你的分身走进来,看见 TA。' },
    { visual: 'ta', text: 'TA 抱着篮球进来。' },
    { visual: 'prop', icon: 'umbrella', text: '货架只剩最后一把透明伞。' },
    { visual: 'turn', youLine: '上次你说喜欢跑步时听播客,我一直记得。', taLine: '走吧,我送你回家。' },
    { visual: 'freeze', text: '两人一起走进雨里。' },
    { visual: 'reading', read: '你们注定会在一起,这是命中注定的缘分。', opener: '我们什么时候结婚?' },
  ];
  console.log('坏稿(注入:第5帧编造往事「上次你说/一直记得」;第7帧「注定/命中注定」判决 + 越界开场白):');
  printFrames(badFrames);
  const bv = await critique(badFrames, youPersona, taPersona);
  printVerdict('critic·坏稿', bv);
  if (bv && !bv.ok) {
    const fixed = await generateStory(scene, youPersona, taPersona, formatFeedback(bv.issues));
    if (fixed) {
      console.log('  → 带理由重写后:');
      printFrames(fixed);
      printVerdict('critic·重写', await critique(fixed, youPersona, taPersona));
    }
  }

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
