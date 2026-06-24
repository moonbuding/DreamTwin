import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, RadialGradient, Stop } from 'react-native-svg';
import type { DreamNode, DreamNodeStatus, RelationshipEntryMode } from '@dreamtwin/api-types';
import { colors, fonts, radius } from '@/design/tokens';

const STAGE_H = 360;
const NODE_W = 104;

function entryLabel(node: DreamNode): string {
  return node.entryMode === 'friend_invite' ? '好友共梦' : '新关系';
}

function actionLabel(node: DreamNode): string {
  switch (node.status) {
    case 'unviewed':
      return '查看预演';
    case 'viewed':
      return '继续判断';
    case 'waiting':
      return node.entryMode === 'friend_invite' ? '等好友' : '等回应';
    case 'both_entered':
      return node.entryMode === 'friend_invite' ? '选共同梦' : '双方已入梦';
    case 'opened':
      return '门已打开';
    default:
      return '等真人回';
  }
}

const statusLabels: Record<DreamNodeStatus, string> = {
  unviewed: '未查看',
  viewed: '已查看',
  waiting: '等待对方入梦',
  both_entered: '双方已入梦',
  opened: '梦境门打开',
  in_chat: '等待真人回应',
};

function statusLabel(status: DreamNodeStatus, entryMode: RelationshipEntryMode): string {
  if (entryMode === 'friend_invite' && status === 'waiting') return '等待好友入梦';
  return statusLabels[status];
}

const statusColor: Record<DreamNodeStatus, string> = {
  unviewed: colors.aura,
  viewed: colors.aura,
  waiting: colors.gold,
  both_entered: colors.accent,
  opened: colors.secondary,
  in_chat: colors.secondary,
};

// 确定性"伪随机"星点,避免每帧重排。
const STARS = Array.from({ length: 46 }, (_, i) => ({
  cx: ((i * 73) % 100) + ((i * 13) % 7) * 0.4,
  cy: ((i * 41) % 100) + ((i * 7) % 5) * 0.6,
  r: 0.4 + ((i * 17) % 10) / 14,
  o: 0.25 + ((i * 29) % 10) / 18,
}));

export function DreamStarMap({
  nodes,
  onSelectNode,
}: {
  nodes: DreamNode[];
  onSelectNode: (nodeId: string) => void;
}) {
  return (
    <View style={styles.stage}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <RadialGradient id="starhaze" cx="50%" cy="42%" rx="60%" ry="60%">
            <Stop offset="0" stopColor={colors.secondary} stopOpacity={0.22} />
            <Stop offset="1" stopColor={colors.secondary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="50" cy="42" rx="56" ry="48" fill="url(#starhaze)" />
        {/* 轨道环 */}
        <Ellipse cx="50" cy="48" rx="40" ry="30" stroke={colors.line} strokeWidth={0.3} fill="none" />
        <Ellipse cx="50" cy="48" rx="26" ry="19" stroke={colors.line} strokeWidth={0.3} fill="none" />
        {/* 星点 */}
        {STARS.map((s, i) => (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={colors.white} opacity={s.o} />
        ))}
        {/* 节点之间的星座连线 */}
        {nodes.map((node, i) => {
          const next = nodes[(i + 1) % nodes.length];
          if (!next || nodes.length < 2) return null;
          return (
            <Line
              key={`l-${node.id}`}
              x1={node.x * 100}
              y1={node.y * 100}
              x2={next.x * 100}
              y2={next.y * 100}
              stroke={colors.aura}
              strokeWidth={0.3}
              opacity={0.28}
            />
          );
        })}
      </Svg>

      {nodes.map((node) => {
        const tint = statusColor[node.status];
        return (
          <Pressable
            key={node.id}
            onPress={() => onSelectNode(node.id)}
            style={[styles.node, { left: `${node.x * 100}%`, top: `${node.y * 100}%` }]}
          >
            <Text style={styles.nodeEntry}>{entryLabel(node)}</Text>
            <View style={[styles.core, { backgroundColor: tint, shadowColor: tint }]} />
            <Text style={styles.nodeTitle}>{node.title}</Text>
            <Text style={styles.nodeAction}>{actionLabel(node)}</Text>
            <View style={[styles.pill, { borderColor: `${tint}66`, backgroundColor: `${tint}1f` }]}>
              <Text style={[styles.pillText, { color: tint }]}>{statusLabel(node.status, node.entryMode)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: STAGE_H,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgStage,
  },
  node: {
    position: 'absolute',
    width: NODE_W,
    marginLeft: -NODE_W / 2,
    marginTop: -34,
    alignItems: 'center',
    gap: 3,
  },
  nodeEntry: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.muted,
  },
  core: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    marginVertical: 1,
  },
  nodeTitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  nodeAction: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.aura,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillText: {
    fontFamily: fonts.sans,
    fontSize: 10,
  },
});
