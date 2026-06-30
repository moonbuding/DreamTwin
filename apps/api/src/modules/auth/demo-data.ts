import type { DreamNode, FriendProfile, TwinProjection, UserProfile } from '@dreamtwin/api-types';

const NODE_TEMPLATES = [
  {
    id: 'node-rain-store',
    title: '雨夜便利店',
    status: 'unviewed',
    simulationId: 'simulation-rain-store',
    entryMode: 'overnight_discovery',
    x: 0.5,
    y: 0.28,
    intensity: 0.84,
    counterpartKind: 'plaza',
    counterpartId: 'plaza-yuzi',
  },
  {
    id: 'node-seaside-radio',
    title: '凌晨海边电台',
    status: 'unviewed',
    simulationId: 'simulation-seaside-radio',
    entryMode: 'overnight_discovery',
    x: 0.27,
    y: 0.64,
    intensity: 0.96,
    counterpartKind: 'plaza',
    counterpartId: 'plaza-haichao',
  },
  {
    id: 'node-moon-platform',
    title: '月光候车厅',
    status: 'unviewed',
    simulationId: 'simulation-moon-platform',
    entryMode: 'overnight_discovery',
    x: 0.73,
    y: 0.62,
    intensity: 0.88,
    counterpartKind: 'plaza',
    counterpartId: 'plaza-qingyan',
  },
  {
    id: 'node-friend-mika',
    title: '和 Mika 的梦境漫游',
    status: 'unviewed',
    simulationId: 'simulation-friend-mika',
    entryMode: 'friend_invite',
    x: 0.5,
    y: 0.48,
    intensity: 0.92,
    counterpartKind: 'friend',
    counterpartId: 'friend-mika',
  },
] satisfies Array<
  Omit<DreamNode, 'status' | 'entryMode'> & {
    status: DreamNode['status'];
    entryMode: DreamNode['entryMode'];
    counterpartKind: 'plaza' | 'friend';
    counterpartId: string;
  }
>;

const FRIEND_TEMPLATES = [
  {
    id: 'friend-mika',
    name: 'Mika',
    relationLabel: '认识很久但还没真正聊深的好友',
    presence: '在线',
    keywords: ['慢热', '行动派', '喜欢运动', '重视边界'],
  },
  {
    id: 'friend-ajie',
    name: '阿杰',
    relationLabel: '一起运动的朋友',
    presence: '1h前',
    keywords: ['直接', '爱开玩笑', '行动派'],
  },
  {
    id: 'friend-xiaoyu',
    name: '小雨',
    relationLabel: '偶尔深聊的旧友',
    presence: '2h前',
    keywords: ['细腻', '安静', '观察者'],
  },
  {
    id: 'friend-leo',
    name: 'Leo',
    relationLabel: '同好社群认识的朋友',
    presence: '离线',
    keywords: ['好奇', '理性', '喜欢科技'],
  },
] satisfies FriendProfile[];

function scopedId(baseId: string, userId: string): string {
  return `${baseId}__${userId}`;
}

export function buildDemoProfile(userId: string, nickname: string): UserProfile {
  return {
    id: userId,
    nickname,
    personalityKeywords: ['慢热', '高共情', '夜间思考者', '重视真实感'],
    relationshipIntention: '想遇见一个可以自然聊深的人',
    interests: ['城市夜行', '独立音乐', '心理学', '影像叙事'],
    optionalSignals: ['偏好低压开场', '喜欢从小事聊到价值观'],
    appearanceTags: ['清冷感', '喜欢深色穿搭'],
    mbti: 'INFJ',
    zodiac: '双鱼',
    mysticTags: ['月亮感', '深夜直觉'],
    communicationStyle: '低压、先观察、用细节靠近',
    values: ['真实感', '边界感', '长期信任'],
  };
}

export function buildTwinFromProfile(profile: UserProfile): TwinProjection {
  const colorPalette = ['#6fd3ff', '#a779ff', '#ff72d2'];
  const keywords = [...profile.personalityKeywords.slice(0, 3), ...profile.interests.slice(0, 1)];

  return {
    id: `twin-${profile.id}`,
    nickname: `${profile.nickname || '你'} 的 DreamTwins`,
    summary: `它会记住你“${profile.relationshipIntention || '想认真靠近一段关系'}”的愿望,用${
      profile.personalityKeywords.slice(0, 2).join('、') || '真实、温柔'
    }的方式帮你预演关系可能性。`,
    colorPalette,
    lightShape: 'orbit',
    keywords: keywords.length ? keywords : ['真实连接', '温柔预演', '慢速靠近'],
    avatarStyleSpec: {
      silhouette: 'full_body_luminous',
      posture: 'curious',
      material: 'star-thread',
      auraColor: colorPalette[0],
      secondaryColor: colorPalette[1],
      accentColor: colorPalette[2],
      motionSignature: 'spark_drift',
      keywords: [
        ...profile.personalityKeywords.slice(0, 2),
        ...(profile.mbti ? [profile.mbti] : []),
        ...(profile.values?.slice(0, 1) ?? []),
        ...(profile.mysticTags?.slice(0, 1) ?? []),
      ].slice(0, 5),
    },
  };
}

export function buildDemoFriendRows(userId: string) {
  return FRIEND_TEMPLATES.map((friend) => ({
    ...friend,
    id: scopedId(friend.id, userId),
    userId,
  }));
}

export function buildDemoNodeRows(userId: string) {
  return NODE_TEMPLATES.map((node) => ({
    ...node,
    id: scopedId(node.id, userId),
    userId,
    counterpartId: node.counterpartKind === 'friend' ? scopedId(node.counterpartId, userId) : node.counterpartId,
  }));
}
