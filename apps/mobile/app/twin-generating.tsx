import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/forms';
import { KeywordRow } from '@/components/atoms';
import { TwinAvatar } from '@/components/TwinAvatar';
import { useAuthStore } from '@/stores/auth';
import { colors, fonts, radius, spacing } from '@/design/tokens';

const STEPS = ['读取靠近方式', '生成抽象投影', '保存为长期分身', '带回关系动态'];

export default function TwinGenerating() {
  const router = useRouter();
  const twin = useAuthStore((s) => s.twin);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => {
        if (current >= STEPS.length - 1) {
          clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 700);
    return () => clearInterval(timer);
  }, []);

  const isComplete = step >= STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const finish = () => {
    void completeOnboarding();
    router.replace('/(tabs)/today');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.label}>首次生成</Text>
          <Text style={styles.title}>你的 DreamTwins 已保存。</Text>
        </View>

        <View style={styles.stage}>
          <TwinAvatar avatarStyleSpec={twin.avatarStyleSpec} />
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.name}>{twin.nickname}</Text>
          <KeywordRow items={twin.keywords} />
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.steps}>
          {STEPS.map((item, index) => {
            const status = isComplete || index < step ? '已完成' : index === step ? '进行中' : '等待';
            const active = index <= step;
            return (
              <View key={item} style={styles.stepRow}>
                <View style={[styles.dot, active ? styles.dotOn : null]} />
                <Text style={[styles.stepText, active ? styles.stepTextOn : null]}>
                  {status} · {item}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton label={isComplete ? '进入今日' : '正在生成…'} icon="arrow-right" onPress={finish} disabled={!isComplete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    gap: 8,
    paddingTop: spacing.md,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.secondary,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  stage: {
    height: 300,
  },
  nameBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontFamily: fonts.sans,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.panelSoft,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.aura,
  },
  steps: {
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.faint,
  },
  dotOn: {
    backgroundColor: colors.aura,
  },
  stepText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.muted,
  },
  stepTextOn: {
    color: colors.textSoft,
  },
  bottom: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
});
