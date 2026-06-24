import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton, GhostButton } from '@/components/forms';
import { useToday } from '@/lib/queries';
import { COUNTERPART_NAME, findDemoNode } from '@/lib/demoContent';
import { colors, fonts, radius, spacing } from '@/design/tokens';

export default function Waiting() {
  const router = useRouter();
  const { node: nodeId } = useLocalSearchParams<{ node: string }>();
  const { data } = useToday();
  const node = data?.nodes.find((n) => n.id === nodeId) ?? findDemoNode(nodeId);
  const isFriend = node?.entryMode === 'friend_invite';
  const counterpart = isFriend ? '好友' : COUNTERPART_NAME;
  const title = node?.title ?? '梦境预演';
  const [confirmed, setConfirmed] = useState(false);

  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const guardrails = isFriend
    ? ['好友确认前不生成共同预演', '不会替你表达关系意图', '可以随时撤回邀请']
    : ['对方确认前不打开聊天', '不会替你发送真实消息', '可以随时撤回这次入梦'];

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={colors.textSoft} />
        </Pressable>
        <Text style={styles.headTitle}>{confirmed ? '双方已入梦' : `等待${counterpart}入梦`}</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          {confirmed
            ? `${counterpart}已入梦,可以开始聊天。`
            : `你已入梦,正在等待 ${counterpart} 共赴这场梦境。`}
        </Text>

        <View style={styles.stage}>
          <Animated.View style={[styles.orbit, { transform: [{ rotate }] }]}>
            <View style={[styles.orbitDot, { top: -5, left: '50%', marginLeft: -5 }]} />
            <View style={[styles.orbitDot, styles.orbitDot2, { bottom: 18, left: 14 }]} />
            <View style={[styles.orbitDot, styles.orbitDot3, { bottom: 26, right: 18 }]} />
          </Animated.View>
          <View style={styles.orbitCore} />
        </View>

        <View style={styles.panel}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{isFriend ? '等待好友入梦' : '等待对方入梦'}</Text>
          </View>
          <Text style={styles.panelTitle}>{title}</Text>
          <Text style={styles.panelText}>
            {isFriend
              ? '好友确认前,这里只保留等待状态。你可以随时撤回这次入梦。'
              : '对方确认前,这里只保留等待状态。你可以随时把这次入梦撤回。'}
          </Text>
          {!confirmed ? (
            <View style={styles.guards}>
              {guardrails.map((g) => (
                <View key={g} style={styles.guardChip}>
                  <Text style={styles.guardText}>{g}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        {confirmed ? (
          <PrimaryButton label="进入聊天" icon="log-in" onPress={() => router.replace(`/dream-gate?node=${nodeId ?? ''}`)} />
        ) : (
          <>
            <PrimaryButton label={`${counterpart}确认入梦(演示)`} icon="bell" onPress={() => setConfirmed(true)} />
            <GhostButton label="撤回这次入梦" onPress={() => router.replace('/(tabs)/dream')} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.sans, fontSize: 16, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
  title: { fontFamily: fonts.sans, fontSize: 22, lineHeight: 32, fontWeight: '700', color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  stage: {
    height: 200,
    borderRadius: radius.xl,
    backgroundColor: colors.bgStage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbit: { width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: `${colors.aura}40` },
  orbitDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: colors.aura },
  orbitDot2: { backgroundColor: colors.secondary },
  orbitDot3: { backgroundColor: colors.accent },
  orbitCore: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: colors.white, opacity: 0.9 },
  panel: {
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: `${colors.gold}1f`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.gold}66`,
  },
  pillText: { fontFamily: fonts.sans, fontSize: 11, color: colors.gold },
  panelTitle: { fontFamily: fonts.sans, fontSize: 16, fontWeight: '700', color: colors.text },
  panelText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: colors.muted },
  guards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  guardChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  guardText: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSoft },
  bottom: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
});
