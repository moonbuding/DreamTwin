import { PrismaClient } from '@prisma/client';
import type { TwinProjection, UserProfile } from '@dreamtwin/api-types';
import { hashPassword } from '../src/modules/auth/password';

const prisma = new PrismaClient();

// 种子 demo persona「小梦」—— 与 legacy 后端一致的登录账号。
const XIAOMENG_PHONE = process.env.DEMO_XIAOMENG_PHONE ?? '13700137000';
const XIAOMENG_PASSWORD = process.env.DEMO_XIAOMENG_PASSWORD ?? 'xiaomeng888';

const profile: UserProfile = {
  id: 'user-xiaomeng',
  nickname: '小梦',
  personalityKeywords: ['温柔', '慢热', '细腻', '爱做梦'],
  relationshipIntention: '想遇见一个能慢慢聊深的人',
  interests: ['星空摄影', '独立音乐', '深夜散步'],
  optionalSignals: ['偏好低压开场', '记得住对话里的小事'],
  mbti: 'INFP',
  zodiac: '双鱼座',
  mysticTags: ['月亮感', '水象共情'],
  communicationStyle: '先观察,再用一个细节温柔地靠近',
  values: ['真实', '边界感', '细水长流'],
};

const twin: TwinProjection = {
  id: 'twin-xiaomeng',
  nickname: '小梦 的 DreamTwins',
  summary: '它记住你的温柔、慢热和细腻,先帮你预演关系可能性,带回可以亲自尝试的片段。',
  colorPalette: ['#6fd3ff', '#a779ff', '#ff72d2'],
  lightShape: 'orbit',
  keywords: ['温柔', '慢热', '细腻', '星空摄影'],
  avatarStyleSpec: {
    silhouette: 'full_body_luminous',
    posture: 'grounded',
    material: 'star-thread',
    auraColor: '#6fd3ff',
    secondaryColor: '#a779ff',
    accentColor: '#ff72d2',
    motionSignature: 'soft_pulse',
    keywords: ['温柔', '慢热', 'INFP', '真实', '月亮感'],
  },
};

const nodes = [
  { id: 'node-rain-store', title: '雨夜便利店', status: 'unviewed', simulationId: 'simulation-rain-store', entryMode: 'overnight_discovery', x: 0.5, y: 0.28, intensity: 0.84 },
  { id: 'node-seaside-radio', title: '凌晨海边电台', status: 'unviewed', simulationId: 'simulation-seaside-radio', entryMode: 'overnight_discovery', x: 0.27, y: 0.64, intensity: 0.96 },
  { id: 'node-moon-platform', title: '月光候车厅', status: 'unviewed', simulationId: 'simulation-moon-platform', entryMode: 'overnight_discovery', x: 0.73, y: 0.62, intensity: 0.88 },
  { id: 'node-friend-mika', title: '和 Mika 的梦境漫游', status: 'unviewed', simulationId: 'simulation-friend-mika', entryMode: 'friend_invite', x: 0.5, y: 0.48, intensity: 0.92 },
];

const friends = [
  { id: 'friend-mika', name: 'Mika', relationLabel: '认识很久但还没真正聊深的好友', presence: '在线', keywords: ['慢热', '行动派', '喜欢运动', '重视边界'] },
  { id: 'friend-ajie', name: '阿杰', relationLabel: '一起运动的朋友', presence: '1h前', keywords: ['直接', '爱开玩笑', '行动派'] },
  { id: 'friend-xiaoyu', name: '小雨', relationLabel: '偶尔深聊的旧友', presence: '2h前', keywords: ['细腻', '安静', '观察者'] },
  { id: 'friend-leo', name: 'Leo', relationLabel: '同好社群认识的朋友', presence: '离线', keywords: ['好奇', '理性', '喜欢科技'] },
];

async function main() {
  const passwordHash = hashPassword(XIAOMENG_PASSWORD);

  const user = await prisma.user.upsert({
    where: { phone: XIAOMENG_PHONE },
    update: { nickname: profile.nickname, passwordHash },
    create: { phone: XIAOMENG_PHONE, nickname: profile.nickname, passwordHash },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { data: profile as object },
    create: { userId: user.id, data: profile as object },
  });

  await prisma.twin.upsert({
    where: { userId: user.id },
    update: { data: twin as object },
    create: { userId: user.id, data: twin as object },
  });

  await prisma.dreamNode.deleteMany({ where: { userId: user.id } });
  await prisma.dreamNode.createMany({ data: nodes.map((node) => ({ ...node, userId: user.id })) });

  await prisma.friend.deleteMany({ where: { userId: user.id } });
  await prisma.friend.createMany({ data: friends.map((friend) => ({ ...friend, userId: user.id })) });

  // eslint-disable-next-line no-console
  console.log(`Seeded demo account 小梦 (phone ${XIAOMENG_PHONE}) with ${nodes.length} nodes, ${friends.length} friends.`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
