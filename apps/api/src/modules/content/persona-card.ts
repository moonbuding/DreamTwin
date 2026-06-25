import type {
  PersonaPsychology,
  RelationshipCounterpartProfile,
  UserProfile,
} from '@dreamtwin/api-types';

// 卡片渲染器:把结构化角色卡片渲染成「情境化 + 带语气样本」的 persona 文本。
// 原则:缺失维度一律跳过(不编造),让模型按基准率留白;语气样本作为 few-shot。

const OCEAN_LABELS: Array<[keyof NonNullable<PersonaPsychology['bigFive']>, string, string]> = [
  ['openness', '爱尝鲜、想象力强', '务实保守'],
  ['conscientiousness', '自律有条理', '随性松弛'],
  ['extraversion', '外向爱热闹', '内敛安静'],
  ['agreeableness', '亲和好商量', '直率有棱角'],
  ['neuroticism', '情绪敏感易波动', '情绪稳定'],
];

function renderBigFive(b?: PersonaPsychology['bigFive']): string[] {
  if (!b) return [];
  const out: string[] = [];
  for (const [key, hi, lo] of OCEAN_LABELS) {
    const v = b[key];
    if (typeof v !== 'number') continue;
    if (v >= 65) out.push(hi);
    else if (v <= 35) out.push(lo);
  }
  return out.length ? [`性格底色:${out.join('、')}`] : [];
}

const ATTACHMENT_DESC: Record<string, string> = {
  secure: '安全型依恋:能稳定表达需求,不易患得患失',
  anxious: '焦虑型依恋:渴望靠近又怕被冷落,容易反复确认',
  avoidant: '回避型依恋:重视独立,亲密升温时本能后撤',
  fearful: '恐惧型依恋:既渴望又害怕亲密,忽近忽远',
};

function renderPsychology(psy?: PersonaPsychology): string[] {
  if (!psy) return [];
  const parts: string[] = [...renderBigFive(psy.bigFive)];
  if (psy.attachmentStyle && ATTACHMENT_DESC[psy.attachmentStyle]) {
    parts.push(ATTACHMENT_DESC[psy.attachmentStyle]);
  }
  if (psy.conflictStyle) parts.push(`冲突时:${psy.conflictStyle}`);
  if (psy.emotionRegulation) parts.push(`情绪调节:${psy.emotionRegulation}`);
  if (psy.loveLanguages?.length) parts.push(`在意的爱的表达:${psy.loveLanguages.join('、')}`);
  if (psy.dealbreakers?.length) parts.push(`红线(绝不接受):${psy.dealbreakers.join('、')}`);
  if (psy.ifThenSignals?.length) {
    const rules = psy.ifThenSignals.map((s) => `若${s.situation}→${s.tendency}`).join(';');
    parts.push(`情境倾向:${rules}`);
  }
  if (psy.voiceSamples?.length) {
    parts.push(`平时这样说话:${psy.voiceSamples.map((s) => `「${s}」`).join(' ')}`);
  }
  return parts;
}

// 渲染「你的分身」卡片(登录用户)。
export function renderPersonaCard(p: UserProfile): string {
  const parts: string[] = [
    p.personalityKeywords?.length ? `性格:${p.personalityKeywords.join('、')}` : '',
    p.mbti ? `MBTI:${p.mbti}` : '',
    p.communicationStyle ? `沟通:${p.communicationStyle}` : '',
    p.values?.length ? `价值观:${p.values.join('、')}` : '',
    p.interests?.length ? `兴趣:${p.interests.join('、')}` : '',
    p.relationshipIntention ? `关系期待:${p.relationshipIntention}` : '',
    p.optionalSignals?.length ? `行为信号:${p.optionalSignals.join('、')}` : '',
    p.mysticTags?.length ? `叙事信号:${p.mysticTags.join('、')}` : '',
    ...renderPsychology(p.psychology),
  ].filter(Boolean);
  return parts.length ? parts.join(';') : '人格信息有限:慢热、真实、温柔。';
}

// 渲染「梦中人」卡片(对手)。无资料时返回空串,由调用方决定留白处理。
export function renderCounterpartCard(c: RelationshipCounterpartProfile): string {
  const parts: string[] = [
    c.relationLabel ? `关系:${c.relationLabel}` : '',
    c.personalityKeywords?.length ? `性格:${c.personalityKeywords.join('、')}` : '',
    c.communicationStyle ? `沟通:${c.communicationStyle}` : '',
    c.values?.length ? `价值观:${c.values.join('、')}` : '',
    c.interests?.length ? `兴趣:${c.interests.join('、')}` : '',
    c.optionalSignals?.length ? `行为信号:${c.optionalSignals.join('、')}` : '',
    ...renderPsychology(c.psychology),
  ].filter(Boolean);
  return parts.join(';');
}
