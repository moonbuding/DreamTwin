import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/forms';
import { getDreamStory, type DreamStory, type StoryFrame } from '@/lib/dreamStories';
import { colors, fonts, radius, spacing } from '@/design/tokens';

const twinAvatar = require('../../assets/twin-avatar.png');

const STARS = Array.from({ length: 28 }, (_, i) => ({
  cx: ((i * 67) % 100) + ((i * 11) % 5) * 0.5,
  cy: ((i * 39) % 100) + ((i * 7) % 6) * 0.4,
  r: 0.5 + ((i * 13) % 8) / 12,
  o: 0.2 + ((i * 23) % 10) / 22,
}));

function Backdrop({ theme }: { theme: DreamStory['theme'] }) {
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <RadialGradient id="g" cx="50%" cy="34%" rx="70%" ry="60%">
          <Stop offset="0" stopColor={theme.glow} stopOpacity={0.32} />
          <Stop offset="0.55" stopColor={theme.accent} stopOpacity={0.08} />
          <Stop offset="1" stopColor={theme.glow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="34" r="80" fill="url(#g)" />
      {STARS.map((s, i) => (
        <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={colors.white} opacity={s.o} />
      ))}
    </Svg>
  );
}

function YouFigure({ theme, size = 168 }: { theme: DreamStory['theme']; size?: number }) {
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <View style={[styles.figGlow, { backgroundColor: `${theme.glow}26`, width: size * 0.9, height: size * 0.9, borderRadius: size }]} />
      <Image source={twinAvatar} style={{ width: size, height: size, resizeMode: 'contain' }} />
      <Text style={[styles.figLabel, { color: theme.glow }]}>你的分身</Text>
    </View>
  );
}

function TaFigure({ theme, size = 120 }: { theme: DreamStory['theme']; size?: number }) {
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={[styles.orb, { width: size, height: size, borderRadius: size, backgroundColor: `${theme.accent}33`, borderColor: theme.accent }]}>
        <View style={[styles.orbCore, { backgroundColor: theme.accent }]} />
      </View>
      <Text style={[styles.figLabel, { color: theme.accent }]}>梦中人</Text>
    </View>
  );
}

function BigIcon({ icon, theme }: { icon: string; theme: DreamStory['theme'] }) {
  return (
    <View style={[styles.bigIconWrap, { borderColor: `${theme.glow}55`, backgroundColor: `${theme.glow}14` }]}>
      <Feather name={icon as never} size={56} color={theme.glow} />
    </View>
  );
}

function Stage({ frame, theme }: { frame: StoryFrame; theme: DreamStory['theme'] }) {
  if (frame.visual === 'you') return <YouFigure theme={theme} />;
  if (frame.visual === 'ta') return <TaFigure theme={theme} />;
  if (frame.visual === 'turn' || frame.visual === 'reading') {
    return (
      <View style={styles.duo}>
        <YouFigure theme={theme} size={frame.visual === 'reading' ? 110 : 132} />
        <TaFigure theme={theme} size={frame.visual === 'reading' ? 78 : 92} />
      </View>
    );
  }
  return <BigIcon icon={frame.icon ?? 'moon'} theme={theme} />;
}

export default function DreamStoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const story = useMemo(() => getDreamStory(id), [id]);
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const frame = story.frames[Math.min(index, story.frames.length - 1)] ?? story.frames[0]!;
  const isReading = frame.visual === 'reading';
  const isLast = index >= story.frames.length - 1;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [index, fade]);

  const go = (dir: 1 | -1) => {
    setIndex((i) => Math.max(0, Math.min(story.frames.length - 1, i + dir)));
  };
  const onTap = (e: GestureResponderEvent) => {
    if (e.nativeEvent.locationX < width * 0.32) go(-1);
    else if (!isLast) go(1);
  };

  return (
    <Screen bg="#05060f">
      <Backdrop theme={story.theme} />

      <View style={styles.topRow}>
        <View style={styles.segments}>
          {story.frames.map((_, i) => (
            <View key={i} style={styles.segTrack}>
              <View style={[styles.segFill, { width: i <= index ? '100%' : '0%', backgroundColor: story.theme.glow }]} />
            </View>
          ))}
        </View>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close}>
          <Feather name="x" size={20} color={colors.textSoft} />
        </Pressable>
      </View>

      <Text style={[styles.sceneLabel, { color: story.theme.glow }]}>{story.title} · 梦境相遇</Text>

      <Pressable style={styles.body} onPress={onTap}>
        <Animated.View style={[styles.bodyInner, { opacity: fade }]}>
          <View style={styles.stage}>
            <Stage frame={frame} theme={story.theme} />
          </View>

          <View style={styles.narration}>
            {isReading ? (
              <View style={[styles.readCard, { borderColor: `${story.theme.glow}40` }]}>
                <Text style={[styles.readKicker, { color: story.theme.glow }]}>这段关系</Text>
                <Text style={styles.readText}>{frame.read}</Text>
                <View style={styles.openerWrap}>
                  <Feather name="message-circle" size={13} color={colors.muted} />
                  <Text style={styles.openerText}>「{frame.opener}」</Text>
                </View>
              </View>
            ) : (
              <>
                {frame.text ? <Text style={styles.narrText}>{frame.text}</Text> : null}
                {frame.youLine ? (
                  <View style={[styles.bubble, styles.bubbleYou, { borderColor: `${story.theme.glow}55` }]}>
                    <Text style={styles.bubbleWho}>你的分身</Text>
                    <Text style={styles.bubbleText}>{frame.youLine}</Text>
                  </View>
                ) : null}
                {frame.taLine ? (
                  <View style={[styles.bubble, styles.bubbleTa, { borderColor: `${story.theme.accent}55` }]}>
                    <Text style={styles.bubbleWho}>梦中人</Text>
                    <Text style={styles.bubbleText}>{frame.taLine}</Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </Animated.View>
      </Pressable>

      <View style={styles.footer}>
        {isReading ? (
          <>
            <PrimaryButton
              label="想进入这个梦境"
              icon="arrow-right"
              onPress={() => router.push(`/waiting?node=${encodeURIComponent(id ?? '')}`)}
            />
            <Text style={styles.safety}>想进入只是告诉对方,不会立刻发消息;双方都愿意,梦境门才会打开。</Text>
          </>
        ) : (
          <Text style={styles.tapHint}>轻点继续 · 向左回看 ›</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  segments: { flex: 1, flexDirection: 'row', gap: 4 },
  segTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  segFill: { height: '100%', borderRadius: 2 },
  close: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  sceneLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  body: { flex: 1 },
  bodyInner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  stage: { minHeight: 230, alignItems: 'center', justifyContent: 'center' },
  duo: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  figGlow: { position: 'absolute', top: 6 },
  figLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '600' },
  orb: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  orbCore: { width: '46%', height: '46%', borderRadius: 999, opacity: 0.92 },
  bigIconWrap: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  narration: { minHeight: 132, justifyContent: 'flex-start', gap: 10, marginTop: spacing.lg },
  narrText: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 28,
    color: colors.text,
    textAlign: 'center',
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 2,
  },
  bubbleYou: { alignSelf: 'flex-end' },
  bubbleTa: { alignSelf: 'flex-start' },
  bubbleWho: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  bubbleText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.text },
  readCard: {
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  readKicker: { fontFamily: fonts.sans, fontSize: 12, letterSpacing: 1 },
  readText: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 26, color: colors.text },
  openerWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  openerText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: colors.muted, fontStyle: 'italic' },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: 8 },
  safety: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.faint, textAlign: 'center' },
  tapHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.faint, textAlign: 'center', paddingVertical: 6 },
});
