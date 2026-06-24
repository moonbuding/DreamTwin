import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenBottom } from '@/components/Screen';
import { colors, fonts } from '@/design/tokens';
import { TabIcon, type DreamTab } from '@/design/icons';

const TABS: { key: DreamTab; label: string; path: string }[] = [
  { key: 'Today', label: '今日', path: '/(tabs)/today' },
  { key: 'Dream', label: '梦境', path: '/(tabs)/dream' },
  { key: 'Messages', label: '消息', path: '/(tabs)/messages' },
  { key: 'Me', label: '我的', path: '/(tabs)/me' },
];

export function TabBar({ active }: { active: DreamTab }) {
  const router = useRouter();

  return (
    <ScreenBottom style={styles.safe}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const on = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                if (!on) router.replace(tab.path as never);
              }}
              style={styles.tab}
              hitSlop={6}
            >
              <TabIcon name={tab.key} size={24} color={on ? colors.aura : colors.faint} />
              <Text style={[styles.label, on ? styles.labelActive : null]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenBottom>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.bgStage,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 60,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.faint,
  },
  labelActive: {
    color: colors.aura,
    fontWeight: '600',
  },
});
