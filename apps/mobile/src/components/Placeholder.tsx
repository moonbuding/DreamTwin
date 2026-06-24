import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { TabBar } from '@/components/TabBar';
import { colors, fonts, spacing } from '@/design/tokens';
import type { DreamTab } from '@/design/icons';

export function Placeholder({
  tab,
  icon,
  title,
  hint,
}: {
  tab: DreamTab;
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  hint: string;
}) {
  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.glow}>
          <Feather name={icon} size={34} color={colors.aura} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>后续批次接入</Text>
        </View>
      </View>
      <TabBar active={tab} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  glow: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
  badge: {
    marginTop: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${colors.secondary}22`,
  },
  badgeText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.secondary,
  },
});
