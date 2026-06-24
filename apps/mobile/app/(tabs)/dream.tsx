import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TabBar } from '@/components/TabBar';
import { DreamStarMap } from '@/components/DreamStarMap';
import { useToday } from '@/lib/queries';
import { colors, fonts, spacing } from '@/design/tokens';

export default function Dream() {
  const router = useRouter();
  const { data } = useToday();
  const nodes = (data?.nodes ?? []).filter((node) => node.entryMode === 'overnight_discovery');

  return (
    <Screen>
      <View style={styles.head}>
        <View style={styles.headSide} />
        <Text style={styles.headTitle}>梦境广场</Text>
        <View style={[styles.headSide, { alignItems: 'flex-end' }]}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/plaza')} hitSlop={6}>
            <Feather name="compass" size={18} color={colors.textSoft} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>AI 为你预演的关系入口</Text>
          <Text style={styles.introSub}>基于你的分身画像生成</Text>
        </View>

        <DreamStarMap nodes={nodes} onSelectNode={(id) => router.push(`/simulation/${id}`)} />

        <View style={styles.note}>
          <Text style={styles.noteText}>点亮一个坐标查看关系预演 · 只有双方都愿意,梦境门才会打开</Text>
        </View>
      </ScrollView>

      <TabBar active="Dream" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headSide: { width: 40 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  headTitle: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  intro: {
    gap: 4,
    paddingVertical: spacing.xs,
  },
  introTitle: {
    fontFamily: fonts.sans,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  introSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.muted,
  },
  note: {
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  noteText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
  },
});
