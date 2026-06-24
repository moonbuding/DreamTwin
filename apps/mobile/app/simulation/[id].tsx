import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/forms';
import { useToday } from '@/lib/queries';
import { defaultSimulationResult, findDemoNode } from '@/lib/demoContent';
import { colors, fonts, radius, spacing } from '@/design/tokens';

function Metric({ label, value, tint, invert }: { label: string; value: number; tint: string; invert?: boolean }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={[styles.metricValue, { color: tint }]}>{value}{invert ? ' · 越低越稳' : ''}</Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width: `${value}%`, backgroundColor: tint }]} />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={styles.bullets}>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function SimulationDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useToday();
  const node = data?.nodes.find((n) => n.id === id) ?? findDemoNode(id);
  const result = defaultSimulationResult;
  const title = node?.title ?? '关系预演';

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={colors.textSoft} />
        </Pressable>
        <Text style={styles.headTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.kicker}>AI 关系预演</Text>
          <Text style={styles.conclusion}>{result.conclusion}</Text>
        </View>

        <View style={styles.metrics}>
          <Metric label="吸引力" value={result.attractionScore} tint={colors.aura} />
          <Metric label="推进节奏" value={result.paceScore} tint={colors.secondary} />
          <Metric label="风险" value={result.riskScore} tint={colors.gold} invert />
        </View>

        <Section title="可能的对话">
          <Bullets items={result.likelyDialogue} />
        </Section>

        <Section title="行为预览">
          <Bullets items={result.behaviorPreview} />
        </Section>

        <Section title="关系走向">
          <Bullets items={result.relationshipTrajectory} />
        </Section>

        <Section title="升温可能">
          <Text style={styles.body}>{result.romancePossibility}</Text>
        </Section>
        <Section title="冲突风险">
          <Text style={styles.body}>{result.conflictRisk}</Text>
        </Section>
        <Section title="可能的坏结局">
          <Text style={styles.body}>{result.badOutcomeScenario}</Text>
        </Section>

        <View style={styles.moveCard}>
          <Text style={styles.moveLabel}>建议动作</Text>
          <Text style={styles.moveText}>{result.suggestedMove}</Text>
          <Text style={styles.firstLineLabel}>可能的第一句</Text>
          <Text style={styles.firstLine}>「{result.possibleFirstLine}」</Text>
        </View>

        <View style={styles.safety}>
          <Feather name="shield" size={14} color={colors.muted} />
          <Text style={styles.safetyText}>{result.safetyHint}</Text>
        </View>

        <PrimaryButton
          label="邀请对方入梦"
          icon="arrow-right"
          onPress={() => router.push(`/dream-gate?node=${encodeURIComponent(id ?? '')}`)}
        />
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
    gap: spacing.lg,
  },
  intro: { gap: 8 },
  kicker: {
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.secondary,
  },
  conclusion: {
    fontFamily: fonts.sans,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.text,
  },
  metrics: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  metric: { gap: 8 },
  metricHead: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSoft },
  metricValue: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '700' },
  metricTrack: { height: 6, borderRadius: 3, backgroundColor: colors.panelSoft, overflow: 'hidden' },
  metricFill: { height: '100%', borderRadius: 3 },
  section: { gap: 10 },
  sectionLabel: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: colors.secondary },
  body: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 23, color: colors.textSoft },
  bullets: { gap: 8 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.aura, marginTop: 8 },
  bulletText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: colors.textSoft },
  moveCard: {
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: `${colors.aura}14`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.aura}40`,
  },
  moveLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  moveText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: colors.text },
  firstLineLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 6 },
  firstLine: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: colors.aura },
  safety: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  safetyText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, lineHeight: 19, color: colors.muted },
});
