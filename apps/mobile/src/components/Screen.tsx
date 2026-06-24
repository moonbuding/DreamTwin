// Screen 容器:安全区 + 暗色梦境背景。
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens';

export function Screen({
  children,
  bg = colors.bg,
}: {
  children: React.ReactNode;
  bg?: string;
}) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: bg }]}>
      {children}
    </SafeAreaView>
  );
}

export function ScreenBottom({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView edges={['bottom']} style={[{ backgroundColor: colors.bg }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
});
