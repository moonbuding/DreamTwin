import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TabBar } from '@/components/TabBar';
import { Avatar, DreamCard } from '@/components/atoms';
import { useToday } from '@/lib/queries';
import { useAuthStore } from '@/stores/auth';
import { colors, fonts, spacing } from '@/design/tokens';

export default function Today() {
  const router = useRouter();
  const { data } = useToday();
  const twinNickname = useAuthStore((s) => s.twin.nickname);

  const greetingName = data?.greetingName ?? twinNickname.replace(/\s*的\s*DreamTwins?.*$/, '').trim() ?? '你';
  const newDreamCount = data?.newDreamCount ?? 0;
  const waitingCount = data?.waitingCount ?? 0;
  const bothEnteredCount = data?.bothEnteredCount ?? 0;
  const friendInitial = (data?.friends[0]?.name ?? '友').slice(0, 1);

  return (
    <Screen>
      <View style={styles.head}>
        <View style={styles.brand}>
          <View style={styles.brandMark} />
          <Text style={styles.brandText}>DreamTwins</Text>
        </View>
        <View style={styles.headRight}>
          <View style={styles.iconBtn}>
            <Feather name="calendar" size={18} color={colors.textSoft} />
          </View>
          <View style={styles.iconBtn}>
            <Feather name="bell" size={18} color={colors.textSoft} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>晚安,{greetingName} ✨</Text>
          <Text style={styles.greetingSub}>这是你今日的关系动态</Text>
        </View>

        <DreamCard
          icon="star"
          tint="violet"
          title="今日梦境"
          subtitle={`${newDreamCount} 个新的关系入口在等你`}
          onPress={() => router.replace('/(tabs)/dream' as never)}
        />
        <DreamCard
          icon="clock"
          tint="gold"
          title="等待回应"
          subtitle={`${waitingCount} 个邀请正在等待对方入梦`}
          aside={<Avatar label={friendInitial} />}
        />
        <DreamCard
          icon="log-in"
          tint="pink"
          title="双方已入梦"
          subtitle={`${bothEnteredCount} 段梦境可进入正常聊天`}
          aside={
            <View style={styles.avaStack}>
              <Avatar label="她" />
              <Avatar label="他" />
            </View>
          }
          onPress={() => router.replace('/(tabs)/messages' as never)}
        />
        <DreamCard
          icon="users"
          tint="aura"
          title="好友邀请"
          subtitle="邀请好友开启共同梦境"
        />
      </ScrollView>

      <TabBar active="Today" />
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
  headRight: {
    flexDirection: 'row',
    gap: 8,
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
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  greeting: {
    paddingVertical: spacing.md,
    gap: 6,
  },
  greetingTitle: {
    fontFamily: fonts.sans,
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  greetingSub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.muted,
  },
  avaStack: {
    flexDirection: 'row',
    gap: -6,
  },
});
