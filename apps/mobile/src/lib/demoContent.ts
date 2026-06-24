// Demo 兜底数据(对齐 legacy web 的本地 demo persona「林星」)。
// 后端 NestJS 起来后,queries 会优先用真实接口,失败再回退到这里——
// 让 iOS 预览在没有后端时也能完整跑通旗舰页面。

import type {
  AuthUser,
  DreamNode,
  FriendProfile,
  TodayResponse,
  TwinProjection,
  UserProfile,
} from '@dreamtwin/api-types';

export const demoUser: AuthUser = {
  id: 'user-aurora',
  phone: '13700137000',
  nickname: '林星',
};

export const demoProfile: UserProfile = {
  id: 'user-aurora',
  nickname: '林星',
  personalityKeywords: ['慢热', '高共情', '夜间思考者', '重视真实感'],
  relationshipIntention: '想遇见一个可以自然聊深的人',
  interests: ['城市夜行', '独立音乐', '心理学', '影像叙事'],
  optionalSignals: ['近期常听深夜电台', '更偏好低压开场', '喜欢从小事聊到价值观'],
  appearanceTags: ['清冷感', '黑长发', '喜欢深色穿搭'],
  education: '本科 · 传媒相关',
  mbti: 'INFJ',
  zodiac: '双鱼',
  mysticTags: ['月亮感', '深夜直觉'],
  communicationStyle: '低压、先观察、用细节靠近',
  values: ['真实感', '边界感', '长期信任'],
};

export const demoTwin: TwinProjection = {
  id: 'twin-aurora',
  nickname: '林星 的 DreamTwins',
  summary:
    '它记住你的慢热、敏感和好奇心,先帮你预演关系可能性,带回可以亲自尝试的片段。',
  colorPalette: ['#6fd3ff', '#a779ff', '#ff72d2'],
  lightShape: 'orbit',
  keywords: ['慢热但深', '温柔预演', '真实连接', '夜色感'],
  // createAvatarStyleSpec(demoProfile, palette) 的实算结果(curious / star-thread / spark_drift)
  avatarStyleSpec: {
    silhouette: 'full_body_luminous',
    posture: 'curious',
    material: 'star-thread',
    auraColor: '#6fd3ff',
    secondaryColor: '#a779ff',
    accentColor: '#ff72d2',
    motionSignature: 'spark_drift',
    keywords: ['慢热', '高共情', 'INFJ', '真实感', '月亮感'],
  },
};

export const demoNodes: DreamNode[] = [
  {
    id: 'node-rain-store',
    title: '雨夜便利店',
    status: 'unviewed',
    simulationId: 'simulation-rain-store',
    entryMode: 'overnight_discovery',
    x: 0.5,
    y: 0.28,
    intensity: 0.84,
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
  },
];

export const demoFriends: FriendProfile[] = [
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
];

export function buildDemoToday(): TodayResponse {
  const overnight = demoNodes.filter((node) => node.entryMode === 'overnight_discovery');
  const newDreamCount = overnight.filter((node) => node.status === 'unviewed').length || overnight.length;
  const waitingCount = demoNodes.filter((node) => node.status === 'waiting').length;
  const bothEnteredCount = demoNodes.filter(
    (node) => node.status === 'both_entered' || node.status === 'opened' || node.status === 'in_chat',
  ).length;

  return {
    greetingName: demoTwin.nickname.replace(/\s*的\s*DreamTwins?.*$/, '').trim() || '你',
    nodes: demoNodes,
    friends: demoFriends,
    newDreamCount,
    waitingCount,
    bothEnteredCount,
  };
}
