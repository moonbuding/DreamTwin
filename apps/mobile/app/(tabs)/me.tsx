import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TabBar } from '@/components/TabBar';
import { KeywordRow, SectionLabel } from '@/components/atoms';
import { TwinAvatar } from '@/components/TwinAvatar';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/auth';
import { colors, fonts, spacing } from '@/design/tokens';

type SubTab = 'personal' | 'twin';

export default function Me() {
  const router = useRouter();
  const [tab, setTab] = useState<SubTab>('twin');
  const profile = useAuthStore((s) => s.profile);
  const twin = useAuthStore((s) => s.twin);
  const clear = useAuthStore((s) => s.clear);

  const logout = () => {
    queryClient.clear();
    void clear();
    router.replace('/onboarding');
  };

  return (
    <Screen>
      <View style={styles.head}>
        <View style={styles.headSide} />
        <Text style={styles.headTitle}>我的</Text>
        <View style={[styles.headSide, styles.headSideRight]}>
          <Pressable style={styles.iconBtn} onPress={logout} hitSlop={6}>
            <Feather name="log-out" size={18} color={colors.textSoft} />
          </Pressable>
        </View>
      </View>

      <View style={styles.subtabs}>
        <SubTabButton label="个人" active={tab === 'personal'} onPress={() => setTab('personal')} />
        <SubTabButton label="分身" active={tab === 'twin'} onPress={() => setTab('twin')} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'twin' ? (
          <>
            <View style={styles.stageWrap}>
              <TwinAvatar avatarStyleSpec={twin.avatarStyleSpec} />
            </View>

            <View style={styles.nameBlock}>
              <Text style={styles.nameTitle}>{twin.nickname}</Text>
              <Text style={styles.nameSub}>网络世界里的你</Text>
            </View>

            <View style={styles.section}>
              <SectionLabel>分身关键词</SectionLabel>
              <KeywordRow items={twin.keywords} />
            </View>

            <View style={styles.section}>
              <SectionLabel>分身摘要</SectionLabel>
              <Text style={styles.bodyText}>{twin.summary}</Text>
            </View>

            <View style={styles.note}>
              <Text style={styles.noteText}>AI 会基于你的画像进行关系预演与建议</Text>
              <Text style={styles.noteText}>不会代替你聊天或做决定</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <SectionLabel>昵称</SectionLabel>
              <Text style={styles.bodyTextStrong}>{profile.nickname}</Text>
            </View>
            <View style={styles.section}>
              <SectionLabel>性格关键词</SectionLabel>
              <KeywordRow items={profile.personalityKeywords} />
            </View>
            <View style={styles.section}>
              <SectionLabel>沟通风格</SectionLabel>
              <Text style={styles.bodyText}>{profile.communicationStyle ?? '—'}</Text>
            </View>
            <View style={styles.section}>
              <SectionLabel>价值观</SectionLabel>
              <KeywordRow items={profile.values ?? []} />
            </View>
            <View style={styles.section}>
              <SectionLabel>兴趣标签</SectionLabel>
              <KeywordRow items={profile.interests} />
            </View>
          </>
        )}
      </ScrollView>

      <TabBar active="Me" />
    </Screen>
  );
}

function SubTabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.subtab} hitSlop={6}>
      <Text style={[styles.subtabText, active ? styles.subtabTextActive : null]}>{label}</Text>
      {active ? <View style={styles.subtabUnderline} /> : null}
    </Pressable>
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
  headSide: {
    width: 40,
  },
  headSideRight: {
    alignItems: 'flex-end',
  },
  headTitle: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
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
  subtabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xs,
  },
  subtab: {
    alignItems: 'center',
    gap: 6,
  },
  subtabText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.muted,
  },
  subtabTextActive: {
    color: colors.text,
    fontWeight: '700',
  },
  subtabUnderline: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  stageWrap: {
    height: 320,
    marginTop: spacing.xs,
  },
  nameBlock: {
    alignItems: 'center',
    gap: 4,
  },
  nameTitle: {
    fontFamily: fonts.sans,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  nameSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.muted,
  },
  section: {
    gap: 10,
  },
  bodyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSoft,
  },
  bodyTextStrong: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  note: {
    gap: 4,
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
  },
});
