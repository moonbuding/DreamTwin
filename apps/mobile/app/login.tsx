import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { AuthResponse, RegisterRequest } from '@dreamtwin/api-types';
import { Screen } from '@/components/Screen';
import { PrimaryButton, TextField } from '@/components/forms';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/auth';
import { colors, fonts, spacing } from '@/design/tokens';

type AuthMode = 'login' | 'register';

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<AuthMode>(params.mode === 'register' ? 'register' : 'login');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isRegister = mode === 'register';

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
    if (isRegister && nickname.trim().length > 16) {
      setError('昵称最多 16 个字。');
      return;
    }
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body: RegisterRequest = {
        phone: trimmed,
        password,
        ...(isRegister && nickname.trim() ? { nickname: nickname.trim() } : {}),
      };
      const { data } = await api.post<AuthResponse>(endpoint, body);
      await setSession({ token: data.token, user: data.user, profile: data.profile, twin: data.twin });
      queryClient.clear();
      router.replace(isRegister ? '/twin-create' : '/(tabs)/today');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        `${isRegister ? '注册' : '登录'}失败,请检查网络或账号信息。`;
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
            <Text style={styles.title}>{isRegister ? '创建你的演示账号' : '欢迎回来'}</Text>
            <Text style={styles.sub}>{isRegister ? '只用手机号和密码,不发送短信验证码。' : '登录后继续你的关系预演。'}</Text>
          </View>

          <View style={styles.modeTabs}>
            <Pressable style={[styles.modeTab, !isRegister ? styles.modeTabOn : null]} onPress={() => setMode('login')}>
              <Text style={[styles.modeTabText, !isRegister ? styles.modeTabTextOn : null]}>登录</Text>
            </Pressable>
            <Pressable style={[styles.modeTab, isRegister ? styles.modeTabOn : null]} onPress={() => setMode('register')}>
              <Text style={[styles.modeTabText, isRegister ? styles.modeTabTextOn : null]}>注册</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            {isRegister ? (
              <TextField label="昵称" value={nickname} onChangeText={setNickname} placeholder="可选,默认生成梦友昵称" autoCapitalize="sentences" />
            ) : null}
            <TextField label="手机号" value={phone} onChangeText={setPhone} placeholder="请输入手机号" keyboardType="number-pad" />
            <TextField label="密码" value={password} onChangeText={setPassword} placeholder="至少 6 位" secureTextEntry />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              label={loading ? '请稍候…' : isRegister ? '注册并创建分身' : '登录'}
              icon="arrow-right"
              onPress={submit}
              loading={loading}
            />

            {!isRegister ? (
              <Pressable
                onPress={() => {
                  setPhone('13700137000');
                  setPassword('xiaomeng888');
                }}
              >
                <Text style={styles.demoHint}>用演示账号「小梦」填充(13700137000)</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.note}>
            {isRegister ? '注册后会自动生成一套演示关系入口,也可以继续编辑你的分身。' : '仅需手机号 + 密码即可开始,无需短信。'}
          </Text>
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
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.panelSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  modeTab: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  modeTabOn: {
    backgroundColor: `${colors.aura}22`,
  },
  modeTabText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.muted,
  },
  modeTabTextOn: {
    color: colors.aura,
    fontWeight: '700',
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
