import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/forms';
import { useSimulation, useToday } from '@/lib/queries';
import { COUNTERPART_NAME, defaultSimulationResult, findDemoNode } from '@/lib/demoContent';
import { colors, fonts, radius, spacing } from '@/design/tokens';

export default function ChatEntry() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useToday();
  const { data: simulation } = useSimulation(id);
  const node = data?.nodes.find((n) => n.id === id) ?? findDemoNode(id);
  const sceneTitle = node?.title ?? '梦境场景';
  const result = simulation ?? defaultSimulationResult;

  const starters = [
    { id: 'recommended', label: '用建议第一句', note: '最贴近预演结论', value: result.possibleFirstLine },
    { id: 'soft', label: '先轻一点', note: '降低压力,留给对方空间', value: `我想先从${sceneTitle}这件事聊起,你会怎么开始?` },
    { id: 'honest', label: '问真实感受', note: '把预演拉回真实体验', value: '刚才那段预演里,有哪一秒让你觉得像真实会发生的事?' },
  ];

  const [starter, setStarter] = useState('recommended');
  const [draft, setDraft] = useState(result.possibleFirstLine);
  const [sent, setSent] = useState<string | null>(null);
  const active = starters.find((s) => s.id === starter) ?? starters[0];

  const selectStarter = (s: (typeof starters)[number]) => {
    setStarter(s.id);
    setDraft(s.value);
  };
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setSent(text);
  };

  useEffect(() => {
    if (starter === 'recommended' && !sent) setDraft(result.possibleFirstLine);
  }, [result.possibleFirstLine, sent, starter]);

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.head}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={colors.textSoft} />
          </Pressable>
          <Text style={styles.headTitle}>正常聊天</Text>
          <View style={styles.back} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{sent ? '聊天已经开始。' : '双方已入梦,开始正常聊天。'}</Text>

          <View style={styles.presence}>
            <Text style={styles.presenceKicker}>AI 未来预告已转入真实聊天</Text>
            <Text style={styles.presenceName}>{COUNTERPART_NAME}</Text>
            <Text style={styles.presenceText}>{result.conclusion}</Text>
          </View>

          <View style={styles.origin}>
            <Text style={styles.originLabel}>AI 预告摘要</Text>
            <Text style={styles.originStrong}>{result.conclusion}</Text>
            <Text style={styles.originText}>{result.suggestedMove}</Text>
          </View>

          {!sent ? (
            <>
              <View style={styles.starters}>
                <Text style={styles.startersLabel}>选择一种开场</Text>
                {starters.map((s) => {
                  const on = s.id === starter;
                  return (
                    <Pressable key={s.id} onPress={() => selectStarter(s)} style={[styles.starter, on ? styles.starterOn : null]}>
                      <Text style={[styles.starterTitle, on ? styles.starterTitleOn : null]}>{s.label}</Text>
                      <Text style={styles.starterNote}>{s.note}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.composer}>
                <View style={styles.composerHead}>
                  <Text style={styles.composerKicker}>由你亲自发送</Text>
                  <Text style={styles.composerStrong}>{active.label}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={draft}
                  onChangeText={setDraft}
                  multiline
                  placeholder="编辑你的第一句话"
                  placeholderTextColor={colors.faint}
                />
                <PrimaryButton label="发送" icon="send" onPress={send} disabled={!draft.trim()} />
              </View>
              <Text style={styles.helper}>可编辑后发送 · AI 不会替你发送任何消息</Text>
            </>
          ) : (
            <View style={styles.thread}>
              <View style={styles.receipt}>
                <Feather name="shield" size={14} color={colors.muted} />
                <Text style={styles.receiptText}>
                  双方已入梦。你已经向 {COUNTERPART_NAME} 发出消息,接下来只等待真人回应。
                </Text>
              </View>
              <View style={styles.bubble}>
                <Text style={styles.bubbleWho}>你</Text>
                <Text style={styles.bubbleText}>{sent}</Text>
              </View>
              <View style={styles.receipt}>
                <Feather name="check-circle" size={14} color={colors.aura} />
                <Text style={styles.receiptText}>
                  消息已进入真实聊天。DreamTwins 的工作到这里结束,接下来只等待真人回应。
                </Text>
              </View>
              <PrimaryButton label="回到消息等待回应" icon="message-circle" onPress={() => router.replace('/(tabs)/messages')} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.sans, fontSize: 16, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { fontFamily: fonts.sans, fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  presence: {
    gap: 4,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  presenceKicker: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  presenceName: { fontFamily: fonts.sans, fontSize: 17, fontWeight: '700', color: colors.text },
  presenceText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: colors.textSoft },
  origin: {
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: `${colors.aura}14`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.aura}40`,
  },
  originLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  originStrong: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: colors.text },
  originText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: colors.textSoft },
  starters: { gap: spacing.xs },
  startersLabel: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: colors.secondary, marginBottom: 4 },
  starter: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    gap: 2,
  },
  starterOn: { borderColor: colors.aura, backgroundColor: `${colors.aura}14` },
  starterTitle: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '600', color: colors.textSoft },
  starterTitleOn: { color: colors.aura },
  starterNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  composer: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  composerHead: { gap: 2 },
  composerKicker: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  composerStrong: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '700', color: colors.text },
  input: {
    minHeight: 80,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  helper: { fontFamily: fonts.sans, fontSize: 12, color: colors.faint, textAlign: 'center' },
  thread: { gap: spacing.sm },
  receipt: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  receiptText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, lineHeight: 19, color: colors.muted },
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    gap: 3,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: `${colors.aura}22`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.aura}55`,
  },
  bubbleWho: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  bubbleText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.text },
});
