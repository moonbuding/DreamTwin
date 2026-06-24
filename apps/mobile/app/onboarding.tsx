import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton, GhostButton } from '@/components/forms';
import { useAuthStore } from '@/stores/auth';
import { colors, fonts, spacing } from '@/design/tokens';

export default function Onboarding() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <View style={styles.brandMark} />
            <Text style={styles.brandText}>DreamTwins</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.label}>AI 双人关系预演社交</Text>
          <Text style={styles.title}>先梦见一种可能,再决定是否亲自进入。</Text>
          <Text style={styles.lead}>
            DreamTwins 会先模拟你和对方如果相遇、聊天、靠近或产生误解,关系可能怎样发展。你选择想进入的那一个,只有双方都愿意,梦境门才会打开。
          </Text>
        </View>

        <View style={styles.proof}>
          <Feather name="star" size={15} color={colors.gold} />
          <Text style={styles.proofText}>不是 AI 陪聊,也不是滑卡匹配。</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="首次创建我的 AI 分身" icon="arrow-right" onPress={() => router.push('/twin-create')} />
          <GhostButton label="已有账号 · 登录" onPress={() => router.push('/login')} />
          <Text
            style={styles.skip}
            onPress={() => {
              void completeOnboarding();
              router.replace('/(tabs)/today');
            }}
          >
            先随便逛逛(demo)
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  top: {
    paddingVertical: spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 16,
    height: 16,
    borderRadius: 6,
    backgroundColor: colors.aura,
  },
  brandText: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.secondary,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 30,
    lineHeight: 42,
    fontWeight: '700',
    color: colors.text,
  },
  lead: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 25,
    color: colors.muted,
  },
  proof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  proofText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.faint,
  },
  actions: {
    gap: spacing.sm,
  },
  skip: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
