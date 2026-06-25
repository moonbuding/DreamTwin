import type { PlazaProfile } from '@dreamtwin/api-types';

// 广场人物(overnight_discovery 节点的「梦中人」来源)。curated 浏览列表,暂不入库。
// 同时服务 /plaza 端点与 CounterpartService 的对手取数。
export const PLAZA_PROFILES: PlazaProfile[] = [
  { id: 'plaza-yuzi', name: '玻璃橘子', tagline: '习惯把真实需求藏在玩笑后面', keywords: ['细腻', '夜行', '影像'], colorPalette: ['#7ad7ff', '#a98bff', '#ff8fd0'], presence: '在线' },
  { id: 'plaza-nanqiao', name: '南乔', tagline: '想认真聊一聊但不爱寒暄', keywords: ['慢热', '阅读', '城市漫步'], colorPalette: ['#9be7c4', '#6fd3ff', '#b3a4ff'], presence: '1h前' },
  { id: 'plaza-haichao', name: '海潮收音机', tagline: '用隐喻表达情绪,慢慢确认同频', keywords: ['松弛', '电台', '海边'], colorPalette: ['#ffc28a', '#ff8fb8', '#a98bff'], presence: '在线' },
  { id: 'plaza-qingyan', name: '清砚', tagline: '清醒、重视边界,先理解再靠近', keywords: ['清醒', '安全感', '纸杯留言'], colorPalette: ['#8fb8ff', '#6fd3ff', '#9be7c4'], presence: '3h前' },
  { id: 'plaza-xingtu', name: '星图收集者', tagline: '喜欢在深夜交换一个真实的瞬间', keywords: ['好奇', '星空', '独立音乐'], colorPalette: ['#b3a4ff', '#7ad7ff', '#ff9ce0'], presence: '昨天' },
];

export function findPlazaProfile(id: string | undefined): PlazaProfile | undefined {
  return id ? PLAZA_PROFILES.find((p) => p.id === id) : undefined;
}
