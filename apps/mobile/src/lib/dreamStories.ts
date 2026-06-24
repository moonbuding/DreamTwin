// 固定模板的「梦境相遇」短故事(图文 PPT 式,字少)。
// 6 帧叙事 + 1 帧关系预言。[ ] 标注的角色行为以后会由 AI 按人格生成,这里先写死。
// 两个角色:「你的分身」(you)与「梦中人」(ta) —— 不用固定姓名,避免和登录用户重名。

export type FrameVisual = 'scene' | 'you' | 'ta' | 'prop' | 'turn' | 'freeze' | 'reading';

export interface StoryFrame {
  visual: FrameVisual;
  icon?: string; // Feather 图标名(scene/prop/freeze 帧用)
  text?: string;
  youLine?: string;
  taLine?: string;
  read?: string; // reading 帧:关系预言
  opener?: string; // reading 帧:可编辑的第一句话
}

export interface DreamStory {
  sceneId: string;
  title: string;
  theme: { glow: string; accent: string };
  frames: StoryFrame[];
}

const rainStore: DreamStory = {
  sceneId: 'node-rain-store',
  title: '雨夜便利店',
  theme: { glow: '#6fd3ff', accent: '#ff72d2' },
  frames: [
    { visual: 'scene', icon: 'cloud-rain', text: '凌晨一点,雨砸在便利店玻璃上。关东煮的热气糊住了窗。' },
    { visual: 'you', text: '你的分身缩着肩进来,假装翻杂志——其实在等雨停。' },
    { visual: 'ta', text: 'TA 抱着还热的包子进来,发现自己的伞被人拿错了。' },
    { visual: 'prop', icon: 'umbrella', text: '货架只剩最后一把透明伞。两只手同时伸了过去。' },
    { visual: 'turn', youLine: '你先。', taLine: '一起走一段?梦里的路总是顺路。' },
    { visual: 'freeze', icon: 'droplet', text: '你们各扯着伞的一边,在雨里走得很慢。霓虹碎在水洼里。' },
    {
      visual: 'reading',
      read: '你们都习惯把「要不要靠近」藏进一个小动作里。这段关系,适合从一件具体的小事开始,而不是先聊定义。',
      opener: '刚才那把伞,你其实是想自己撑,还是想一起?',
    },
  ],
};

const seasideRadio: DreamStory = {
  sceneId: 'node-seaside-radio',
  title: '凌晨海边电台',
  theme: { glow: '#4de0b6', accent: '#ffbe74' },
  frames: [
    { visual: 'scene', icon: 'radio', text: '四点半的海边,天没亮。旧电台亭的灯还亮着,飘出一首没人点的歌。' },
    { visual: 'you', text: '你的分身坐在防波堤上发呆,手里攥着一张写了又划掉的纸。' },
    { visual: 'ta', text: 'TA 推开电台亭的门——今晚的 DJ 原来是 TA。' },
    { visual: 'prop', icon: 'wind', text: 'TA 对麦说:「下一首,送给堤上没走的人。」海风把你手里的纸吹走了。' },
    { visual: 'turn', text: '海浪很大,没人听得清——于是你念了出来。', taLine: '梦里的字不算数,但你愿意念吗?就当电台不录音。' },
    { visual: 'freeze', icon: 'sunrise', text: '谁都没问那写的是什么,但天开始亮了,歌还在放。' },
    {
      visual: 'reading',
      read: '你们都更敢在「不会被记录」的地方说真话。这段关系的钥匙:先给彼此一个不必负责的安全角落。',
      opener: '如果有个电台只放给你一个人听,你想点哪首?',
    },
  ],
};

const moonPlatform: DreamStory = {
  sceneId: 'node-moon-platform',
  title: '月光候车厅',
  theme: { glow: '#a779ff', accent: '#dfe6f4' },
  frames: [
    { visual: 'scene', icon: 'moon', text: '午夜候车厅,月光从破天窗漏进来。时刻表空白,广播只报「下一班:未知」。' },
    { visual: 'you', text: '你的分身坐在最角落,把背包放在旁边空位上——像在守一条线。' },
    { visual: 'ta', text: 'TA 拎着旧行李箱进来,满屋空位却走到你这排:「这个位置,我等很久了。」' },
    { visual: 'prop', icon: 'volume-2', text: '广播响了:「下一班,开往你最不敢去的地方。」灯闪了一下。' },
    { visual: 'turn', text: '你下意识想拿走背包,又停住。', taLine: '我不抢你的边界,我在它旁边等。' },
    { visual: 'freeze', icon: 'edit-3', text: '车没来。但你们把时刻表上的空白,一人写了一站。' },
    {
      visual: 'reading',
      read: '你习惯先设边界,而 TA 愿意在边界旁边等,而不是翻过来。节奏:慢但稳——别急着拆墙,先一起写时刻表。',
      opener: '如果这班车能去任何地方,你会写哪一站?',
    },
  ],
};

const stories: Record<string, DreamStory> = {
  'node-rain-store': rainStore,
  'node-seaside-radio': seasideRadio,
  'node-moon-platform': moonPlatform,
};

export function getDreamStory(nodeId: string | undefined): DreamStory {
  return (nodeId && stories[nodeId]) || rainStore;
}
