import type { DreamStory } from '@dreamtwin/api-types';

// 场景模板:固定的「节拍骨架」。AI 只在每个 beat 里填血肉,不改骨架。
export interface SceneTemplate {
  sceneId: string;
  title: string;
  theme: { glow: string; accent: string };
  mood: string;
  beats: string[]; // 7 个 beat,对应 scene/you/ta/prop/turn/freeze/reading
}

export const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    sceneId: 'node-rain-store',
    title: '雨夜便利店',
    theme: { glow: '#6fd3ff', accent: '#ff72d2' },
    mood: '凌晨、霓虹、雨声、暖光便利店,关东煮的热气',
    beats: [
      '场景设定:用一两句把雨夜便利店的氛围立起来',
      '你的分身入场:把 TA 的性格写进一个小动作里',
      '梦中人入场:对方分身登场,带一点反差',
      '触发点:场景里出现一个小道具/小选择(如最后一把伞)',
      '互动转折:两人按各自性格反应,给出双方各一句台词',
      '定格:一个留白的画面',
      '关系预言:一段观察 + 一句可发的开场白',
    ],
  },
  {
    sceneId: 'node-seaside-radio',
    title: '凌晨海边电台',
    theme: { glow: '#4de0b6', accent: '#ffbe74' },
    mood: '黎明前海边、废弃电台亭还亮着、海浪、没人点的歌',
    beats: [
      '场景设定:黎明前的海边电台亭',
      '你的分身入场:在防波堤上,带一点未说出口的东西',
      '梦中人入场:对方是今晚的 DJ',
      '触发点:电台点名 / 一张被海风吹走的纸',
      '互动转折:在"不会被记录"的安全角落里说真话,双方各一句',
      '定格:天开始亮,歌还在放',
      '关系预言:观察 + 开场白',
    ],
  },
  {
    sceneId: 'node-moon-platform',
    title: '月光候车厅',
    theme: { glow: '#a779ff', accent: '#dfe6f4' },
    mood: '午夜候车厅、月光从破天窗漏进来、空白时刻表、永远不来的车',
    beats: [
      '场景设定:午夜候车厅与空白时刻表',
      '你的分身入场:用一个动作守住一条边界',
      '梦中人入场:对方偏偏走到你这排',
      '触发点:一条广播 / 一个被占的座位',
      '互动转折:边界与靠近的拉扯,双方各一句',
      '定格:车没来,但你们一起写了时刻表',
      '关系预言:观察 + 开场白',
    ],
  },
];

export function getSceneTemplate(nodeId: string | undefined): SceneTemplate {
  return SCENE_TEMPLATES.find((s) => s.sceneId === nodeId) ?? SCENE_TEMPLATES[0]!;
}

// 固定脚本:① AI 失败时的兜底;② AI 生成的 few-shot 示例。
const FIXED: Record<string, DreamStory> = {
  'node-rain-store': {
    sceneId: 'node-rain-store',
    title: '雨夜便利店',
    theme: { glow: '#6fd3ff', accent: '#ff72d2' },
    source: 'fixed',
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
  },
  'node-seaside-radio': {
    sceneId: 'node-seaside-radio',
    title: '凌晨海边电台',
    theme: { glow: '#4de0b6', accent: '#ffbe74' },
    source: 'fixed',
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
  },
  'node-moon-platform': {
    sceneId: 'node-moon-platform',
    title: '月光候车厅',
    theme: { glow: '#a779ff', accent: '#dfe6f4' },
    source: 'fixed',
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
  },
};

export function getFixedStory(nodeId: string | undefined): DreamStory {
  return (nodeId && FIXED[nodeId]) || FIXED['node-rain-store']!;
}
