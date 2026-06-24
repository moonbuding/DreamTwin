import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import type { AvatarStyleSpec } from '@dreamtwin/api-types';
import { colors, radius } from '@/design/tokens';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const avatarImage = require('../../assets/twin-avatar.png');

const AnimatedImage = Animated.Image;

/**
 * 图片版 AI 分身:猫耳少年立绘 + 一个有"3D 打光"感的舞台框 ——
 * 顶部 key light、人格色光环、地面光池(react-native-svg 径向渐变)+ 轻微漂浮。
 * 替换 legacy web 里的 three.js 程序化剪影。
 */
export function TwinAvatar({
  avatarStyleSpec,
  style,
}: {
  avatarStyleSpec?: AvatarStyleSpec;
  style?: ViewStyle;
}) {
  const aura = avatarStyleSpec?.auraColor ?? colors.aura;
  const secondary = avatarStyleSpec?.secondaryColor ?? colors.secondary;
  const accent = avatarStyleSpec?.accentColor ?? colors.accent;

  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });

  return (
    <View style={[styles.stage, style]}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="twinKey" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={aura} stopOpacity={0.55} />
            <Stop offset="1" stopColor={aura} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="twinGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={secondary} stopOpacity={0.6} />
            <Stop offset="1" stopColor={secondary} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="twinFloor" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={aura} stopOpacity={0.6} />
            <Stop offset="1" stopColor={aura} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="twinAccent" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={accent} stopOpacity={0.32} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* 顶部 key light */}
        <Ellipse cx="50%" cy="12%" rx="46%" ry="44%" fill="url(#twinKey)" />
        {/* 人格色光环 */}
        <Ellipse cx="50%" cy="56%" rx="36%" ry="36%" fill="url(#twinGlow)" />
        {/* accent 暖光 */}
        <Ellipse cx="62%" cy="40%" rx="24%" ry="28%" fill="url(#twinAccent)" />
        {/* 地面光池 */}
        <Ellipse cx="50%" cy="92%" rx="30%" ry="7%" fill="url(#twinFloor)" />
      </Svg>

      <AnimatedImage
        source={avatarImage}
        resizeMode="contain"
        style={[styles.img, { transform: [{ translateY }], shadowColor: aura }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    minHeight: 300,
    borderRadius: radius.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: colors.bgStage,
  },
  img: {
    width: '86%',
    height: '94%',
    // iOS: 给立绘加一层 aura 色 rim 光晕(web/Android 会优雅忽略)
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
  },
});
