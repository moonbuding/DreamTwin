import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { FriendProfile } from '@dreamtwin/api-types';
import { Screen } from '@/components/Screen';
import { TabBar } from '@/components/TabBar';
import { Avatar } from '@/components/atoms';
import { PrimaryButton } from '@/components/forms';
import { useToday } from '@/lib/queries';
import { colors, fonts, radius, spacing } from '@/design/tokens';

type SubTab = 'contacts' | 'chat';

export default function Messages() {
  const router = useRouter();
  const { data } = useToday();
  const friends = data?.friends ?? [];
  const nodes = data?.nodes ?? [];
  const [tab, setTab] = useState<SubTab>('contacts');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = friends.find((f) => f.id === selectedId) ?? friends[0];

  const threads = nodes.filter(
    (n) => n.status === 'waiting' || n.status === 'both_entered' || n.status === 'opened' || n.status === 'in_chat',
  );
  const friendNode = nodes.find((n) => n.entryMode === 'friend_invite');

  return (
    <Screen>
      <View style={styles.head}>
        <View style={styles.headSide} />
        <Text style={styles.headTitle}>消息</Text>
        <View style={[styles.headSide, { alignItems: 'flex-end' }]}>
          <View style={styles.iconBtn}>
            <Feather name="plus" size={18} color={colors.textSoft} />
          </View>
        </View>
      </View>

      <View style={styles.subtabs}>
        <SubTabBtn label="通讯录" active={tab === 'contacts'} onPress={() => setTab('contacts')} />
        <SubTabBtn label="聊天" active={tab === 'chat'} onPress={() => setTab('chat')} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'contacts' ? (
          <>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>先邀请,不先分析</Text>
              <Text style={styles.panelText}>
                不单方面分析好友、不读取通讯录,也不替你表达关系意图。好友接受后,你们才会进入同一张梦境地图,共同选择场景。
              </Text>
            </View>

            <View style={styles.friendList}>
              {friends.map((friend: FriendProfile) => {
                const on = friend.id === selected?.id;
                return (
                  <Pressable
                    key={friend.id}
                    onPress={() => setSelectedId(friend.id)}
                    style={[styles.friendItem, on ? styles.friendItemOn : null]}
                  >
                    <Avatar label={friend.name.slice(0, 1)} />
                    <View style={styles.friendMeta}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <Text style={styles.friendPresence}>{friend.presence}</Text>
                    </View>
                    <Text style={[styles.friendInvite, on ? styles.friendInviteOn : null]}>{on ? '已选' : '邀请'}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.selectBar}>
              <Text style={styles.selectName}>已选:{selected?.name ?? '好友'}</Text>
              <Text style={styles.selectHint}>AI 只提供关系预演,不会替你表达或发送任何信息</Text>
              <PrimaryButton
                label="邀请好友入梦"
                icon="send"
                onPress={() => router.push(`/waiting?node=${friendNode?.id ?? 'node-friend-mika'}`)}
              />
            </View>
          </>
        ) : (
          <>
            {threads.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Feather name="compass" size={22} color={colors.aura} />
                </View>
                <Text style={styles.emptyTitle}>还没有可进入的真人聊天</Text>
                <Text style={styles.emptyText}>双方都入梦后,会直接进入正常聊天。</Text>
                <View style={{ width: '100%', marginTop: spacing.sm }}>
                  <PrimaryButton label="去梦境广场" icon="arrow-right" onPress={() => router.replace('/(tabs)/dream')} />
                </View>
              </View>
            ) : null}

            <View style={styles.note}>
              <Text style={styles.noteText}>真实聊天仅在双方都入梦后开始</Text>
              <Text style={styles.noteText}>AI 只带入预演摘要,不会替你发送任何消息</Text>
            </View>
          </>
        )}
      </ScrollView>

      <TabBar active="Messages" />
    </Screen>
  );
}

function SubTabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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
  headSide: { width: 40 },
  headTitle: { fontFamily: fonts.sans, fontSize: 17, fontWeight: '700', color: colors.text },
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
  subtabs: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.xs },
  subtab: { alignItems: 'center', gap: 6 },
  subtabText: { fontFamily: fonts.sans, fontSize: 16, color: colors.muted },
  subtabTextActive: { color: colors.text, fontWeight: '700' },
  subtabUnderline: { width: 22, height: 3, borderRadius: 2, backgroundColor: colors.secondary },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  panel: {
    gap: 8,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  panelTitle: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '700', color: colors.text },
  panelText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 21, color: colors.muted },
  friendList: { gap: spacing.xs },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  friendItemOn: { borderColor: colors.aura, backgroundColor: `${colors.aura}14` },
  friendMeta: { flex: 1, gap: 2 },
  friendName: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: colors.text },
  friendPresence: { fontFamily: fonts.sans, fontSize: 12, color: colors.faint },
  friendInvite: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  friendInviteOn: { color: colors.aura, fontWeight: '600' },
  selectBar: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  selectName: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '700', color: colors.text },
  selectHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    marginBottom: spacing.xs,
  },
  emptyTitle: { fontFamily: fonts.sans, fontSize: 16, fontWeight: '700', color: colors.text },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center' },
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
