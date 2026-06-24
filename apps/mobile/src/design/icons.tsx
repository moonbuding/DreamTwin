import React from 'react';
import { Feather } from '@expo/vector-icons';

export type DreamTab = 'Today' | 'Dream' | 'Messages' | 'Me';

const TAB_GLYPH: Record<DreamTab, React.ComponentProps<typeof Feather>['name']> = {
  Today: 'home',
  Dream: 'moon',
  Messages: 'message-circle',
  Me: 'user',
};

export function TabIcon({
  name,
  size = 24,
  color,
}: {
  name: DreamTab;
  size?: number;
  color: string;
}) {
  return <Feather name={TAB_GLYPH[name]} size={size} color={color} />;
}
