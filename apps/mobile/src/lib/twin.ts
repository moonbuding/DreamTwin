// 从用户画像生成 AI 分身投影(端口自 legacy server/defaults.ts)。
import type { AvatarStyleSpec, TwinProjection, UserProfile } from '@dreamtwin/api-types';

export function createAvatarStyleSpec(profile: UserProfile, palette: string[]): AvatarStyleSpec {
  const joinedSignals = [
    ...profile.personalityKeywords,
    ...profile.interests,
    ...profile.optionalSignals,
    ...(profile.values ?? []),
    ...(profile.mysticTags ?? []),
    profile.mbti ?? '',
    profile.zodiac ?? '',
    profile.communicationStyle ?? '',
  ].join(' ');
  const isCurious = /好奇|探索|风象|旅行|影像|心理/.test(joinedSignals);
  const isGrounded = /真实|边界|长期|稳定|土象|低压/.test(joinedSignals);
  const isIntuitive = /INF|INFP|INFJ|夜|直觉|月亮|水象|双鱼/.test(joinedSignals);
  const isActionLed = /行动|直接|火象|运动|表达/.test(joinedSignals);
  const posture: AvatarStyleSpec['posture'] =
    isActionLed || joinedSignals.includes('直接')
      ? 'open'
      : isCurious
        ? 'curious'
        : isGrounded
          ? 'grounded'
          : 'reserved';
  const material: AvatarStyleSpec['material'] = isIntuitive
    ? 'star-thread'
    : joinedSignals.includes('共情')
      ? 'mist-light'
      : 'glass-light';
  const motionSignature: AvatarStyleSpec['motionSignature'] = isActionLed
    ? 'spark_drift'
    : joinedSignals.includes('共情') || joinedSignals.includes('温柔')
      ? 'soft_pulse'
      : 'slow_orbit';

  return {
    silhouette: 'full_body_luminous',
    posture,
    material,
    auraColor: palette[0] ?? '#6fd3ff',
    secondaryColor: palette[1] ?? '#a779ff',
    accentColor: palette[2] ?? '#f4f7ff',
    motionSignature,
    keywords: [
      ...profile.personalityKeywords.slice(0, 2),
      ...(profile.mbti ? [profile.mbti] : []),
      ...(profile.values?.slice(0, 1) ?? []),
      ...(profile.mysticTags?.slice(0, 1) ?? []),
    ].slice(0, 5),
  };
}

export function createTwinFromProfile(profile: UserProfile): TwinProjection {
  const keywords = [...profile.personalityKeywords.slice(0, 3), ...profile.interests.slice(0, 1)];
  const colorPalette = ['#6fd3ff', '#a779ff', '#f4f7ff'];

  return {
    id: 'twin-local',
    nickname: `${profile.nickname || '你'} 的 DreamTwins`,
    summary: `它会记住你“${profile.relationshipIntention || '想认真靠近一段关系'}”的愿望,用${
      profile.personalityKeywords.slice(0, 2).join('、') || '真实、温柔'
    }的方式帮你预演关系可能性。`,
    colorPalette,
    lightShape: 'orbit',
    keywords: keywords.length ? keywords : ['真实连接', '温柔预演', '慢速靠近'],
    avatarStyleSpec: createAvatarStyleSpec(profile, colorPalette),
  };
}
