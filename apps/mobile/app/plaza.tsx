import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import type { PlazaProfile } from '@dreamtwin/api-types';
import { Screen } from '@/components/Screen';
import { demoPlazaProfiles } from '@/lib/demoContent';
import { colors, fonts, radius, spacing } from '@/design/tokens';

function Orb({ profile }: { profile: PlazaProfile }) {
  const [a, b, c] = profile.colorPalette;
  const gid = `orb-${profile.id}`;
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={a ?? colors.aura} />
          <Stop offset="0.55" stopColor={b ?? colors.secondary} />
          <Stop offset="1" stopColor={c ?? colors.accent} />
        </LinearGradient>
      </Defs>
      <Circle cx="24" cy="24" r="22" fill={`url(#${gid})`} />
    </Svg>
  );
}

export default function Plaza() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.head}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={colors.textSoft} />
        </Pressable>
        <Text style={styles.headTitle}>广场</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introTitle}>看看正在做梦的人</Text>
          <Text style={styles.introSub}>浏览别人的 AI 分身,想靠近就邀请一起入梦</Text>
        </View>

        <View style={styles.searchBar}>
          <Feather name="search" size={15} color={colors.faint} />
          <Text style={styles.searchText}>搜索分身、关键词</Text>
        </View>

        <View style={styles.grid}>
          {demoPlazaProfiles.map((profile) => (
            <View key={profile.id} style={styles.card}>
              <Orb profile={profile} />
              <Text style={styles.name}>{profile.name}</Text>
              <View style={styles.presence}>
                <View style={styles.presenceDot} />
                <Text style={styles.presenceText}>{profile.presence}</Text>
              </View>
              <Text style={styles.tagline} numberOfLines={2}>{profile.tagline}</Text>
              <Pressable style={styles.invite} onPress={() => router.push('/waiting?node=node-friend-mika')}>
                <Feather name="star" size={12} color={colors.aura} />
                <Text style={styles.inviteText}>邀请共同入梦</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>广场只展示 AI 分身,不是动态信息流</Text>
          <Text style={styles.noteText}>只有双方都愿意,梦境门才会打开</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.sans, fontSize: 16, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  intro: { gap: 4 },
  introTitle: { fontFamily: fonts.sans, fontSize: 18, fontWeight: '700', color: colors.text },
  introSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  searchText: { fontFamily: fonts.sans, fontSize: 14, color: colors.faint },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    width: '48%',
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  name: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  presence: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  presenceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.aura },
  presenceText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  tagline: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.textSoft, minHeight: 36 },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: `${colors.aura}1f`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${colors.aura}55`,
    marginTop: 2,
  },
  inviteText: { fontFamily: fonts.sans, fontSize: 12, color: colors.aura },
  note: {
    gap: 4,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  noteText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
});
