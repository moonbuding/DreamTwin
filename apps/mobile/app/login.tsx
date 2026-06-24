import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { AuthResponse } from '@dreamtwin/api-types';
import { Screen } from '@/components/Screen';
import { PrimaryButton, TextField } from '@/components/forms';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { colors, fonts, spacing } from '@/design/tokens';

export default function Login() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (loading) return;
    setError(null);
    const trimmed = phone.trim();
    if (!/^\d{6,20}$/.test(trimmed)) {
      setError('请输入有效的手机号。');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要 6 位。');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { phone: trimmed, password });
      await setSession({ token: data.token, user: data.user, profile: data.profile, twin: data.twin });
      router.replace('/(tabs)/today');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '登录失败,请检查网络或账号信息。';
      setError(Array.isArray(message) ? message[0] : String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={colors.textSoft} />
          </Pressable>

          <View style={styles.hero}>
            <Text style={styles.title}>欢迎回来</Text>
            <Text style={styles.sub}>登录后继续你的关系预演。</Text>
          </View>

          <View style={styles.form}>
            <TextField label="手机号" value={phone} onChangeText={setPhone} placeholder="请输入手机号" keyboardType="number-pad" />
            <TextField label="密码" value={password} onChangeText={setPassword} placeholder="至少 6 位" secureTextEntry />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton label={loading ? '请稍候…' : '登录'} icon="arrow-right" onPress={submit} loading={loading} />

            <Pressable
              onPress={() => {
                setPhone('13700137000');
                setPassword('xiaomeng888');
              }}
            >
              <Text style={styles.demoHint}>用演示账号「小梦」填充(13700137000)</Text>
            </Pressable>
          </View>

          <Text style={styles.note}>仅需手机号 + 密码即可开始,无需短信。</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  back: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  hero: {
    gap: 8,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.muted,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.danger,
  },
  demoHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.aura,
    textAlign: 'center',
    paddingVertical: 6,
  },
  note: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.faint,
    textAlign: 'center',
  },
});
