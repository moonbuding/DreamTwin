import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton, GhostButton } from '@/components/forms';
import { useSimulation, useToday } from '@/lib/queries';
import { defaultSimulationResult, findDemoNode } from '@/lib/demoContent';
import { colors, fonts, radius, spacing } from '@/design/tokens';

export default function DreamGate() {
  const router = useRouter();
  const { node: nodeId } = useLocalSearchParams<{ node: string }>();
  const { data } = useToday();
  const { data: simulation } = useSimulation(nodeId);
  const node = data?.nodes.find((n) => n.id === nodeId) ?? findDemoNode(nodeId);
  const isFriend = node?.entryMode === 'friend_invite';
  const counterpart = isFriend ? '好友' : '对方';
  const title = node?.title ?? '梦境预演';
  const result = simulation ?? defaultSimulationResult;

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={colors.textSoft} />
        </Pressable>
        <Text style={styles.headTitle}>梦境门</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.gateGlyph}>
          <View style={styles.ring} />
          <View style={[styles.ring, styles.ring2]} />
          <Feather name="unlock" size={26} color={colors.aura} />
        </View>

        <Text style={styles.title}>{counterpart}也选择进入。</Text>

        <View style={styles.statusRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>双方已入梦</Text>
          </View>
          <Text style={styles.statusText}>{title}</Text>
        </View>

        <View style={styles.threshold}>
          {['你确认进入', `${counterpart}确认`, '真实聊天打开'].map((stepLabel, i) => (
            <View key={stepLabel} style={styles.thresholdStep}>
              <View style={styles.thresholdDot}>
                <Feather name="check" size={11} color={colors.black} />
              </View>
              <Text style={styles.thresholdText}>{stepLabel}</Text>
              {i < 2 ? <View style={styles.thresholdLine} /> : null}
            </View>
          ))}
        </View>

        <Text style={styles.lead}>双方都确认愿意继续。预演结束,真实关系现在交还给你们两个人。</Text>

        <View style={styles.handoff}>
          <View style={styles.handoffRow}>
            <Feather name="star" size={15} color={colors.gold} />
            <Text style={styles.handoffText}>AI 已把预演压缩成低压开场</Text>
          </View>
          <View style={styles.handoffRow}>
            <Feather name="shield" size={15} color={colors.aura} />
            <Text style={styles.handoffText}>双方确认后,才允许进入真人聊天</Text>
          </View>
        </View>

        <View style={styles.nextStep}>
          <Text style={styles.nextLabel}>下一步只做一件事</Text>
          <Text style={styles.nextStrong}>把建议改成你的语气,发出第一句话。</Text>
          <Text style={styles.nextLine}>「{result.possibleFirstLine}」</Text>
        </View>

        <PrimaryButton label="去写第一句话" icon="message-circle" onPress={() => router.replace(`/chat/${encodeURIComponent(nodeId ?? '')}`)} />
        <GhostButton label="回到梦境地图" onPress={() => router.replace('/(tabs)/dream')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  gateGlyph: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: `${colors.aura}55`,
  },
  ring2: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderColor: `${colors.secondary}66`,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: `${colors.accent}1f`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.accent}66`,
  },
  pillText: { fontFamily: fonts.sans, fontSize: 11, color: colors.accent },
  statusText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  threshold: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  thresholdStep: { flexDirection: 'row', alignItems: 'center' },
  thresholdDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.aura,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thresholdText: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft, marginLeft: 6 },
  thresholdLine: { width: 16, height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginHorizontal: 6 },
  lead: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  handoff: {
    gap: 12,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  handoffRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  handoffText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSoft },
  nextStep: {
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: `${colors.aura}14`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.aura}40`,
  },
  nextLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  nextStrong: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: colors.text },
  nextLine: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: colors.aura },
});
