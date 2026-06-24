import { Platform } from 'react-native';

// DreamTwin 暗色"梦境"配色,1:1 对齐 legacy web 的 CSS 变量(global.css :root)。
export const colors = {
  bg: '#050713',
  bgStage: '#060816',
  panel: 'rgba(16, 21, 43, 0.82)',
  panelSoft: 'rgba(255, 255, 255, 0.07)',
  panelSofter: 'rgba(255, 255, 255, 0.04)',
  line: 'rgba(179, 203, 255, 0.16)',
  lineStrong: 'rgba(179, 203, 255, 0.28)',
  text: '#f5f7ff',
  textSoft: 'rgba(245, 247, 255, 0.88)',
  muted: '#a8b2cf',
  faint: '#7e88a6',
  // 极光三色:分身打光 / 人格映射
  aura: '#6fd3ff', // blue
  secondary: '#a779ff', // violet
  accent: '#ff72d2', // pink
  gold: '#ffbe74',
  danger: '#ff8fb8',
  white: '#ffffff',
  black: '#060816',
  shadow: 'rgba(4, 6, 18, 0.55)',
} as const;

const sans = Platform.select({
  ios: 'PingFang SC',
  android: 'sans-serif',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
  default: 'System',
})!;

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Times New Roman", serif',
  default: 'serif',
})!;

export const fonts = {
  sans,
  sansBold: sans,
  serif,
  serifBold: serif,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
} as const;

export type AppColor = keyof typeof colors;
