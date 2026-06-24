import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/design/tokens';

export function Keyword({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.keyword}>
      <Text style={styles.keywordText}>{children}</Text>
    </View>
  );
}

export function KeywordRow({ items }: { items: string[] }) {
  return (
    <View style={styles.keywordRow}>
      {items.map((item) => (
        <Keyword key={item}>{item}</Keyword>
      ))}
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const TINTS = {
  violet: colors.secondary,
  gold: colors.gold,
  pink: colors.accent,
  aura: colors.aura,
} as const;

export function DreamCard({
  icon,
  title,
  subtitle,
  tint = 'aura',
  aside,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle: string;
  tint?: keyof typeof TINTS;
  aside?: React.ReactNode;
  onPress?: () => void;
}) {
  const tintColor = TINTS[tint];
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
      onPress={onPress}
    >
      <View style={[styles.cardIcon, { backgroundColor: `${tintColor}22` }]}>
        <Feather name={icon} size={20} color={tintColor} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.cardAside}>{aside ?? <Feather name="chevron-right" size={20} color={colors.faint} />}</View>
    </Pressable>
  );
}

export function Avatar({ label }: { label: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  keyword: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  keywordText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSoft,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.muted,
  },
  cardAside: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  avatarText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textSoft,
  },
});
