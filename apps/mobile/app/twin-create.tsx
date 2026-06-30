import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { MeResponse, ProfileTwinRequest, UserProfile } from '@dreamtwin/api-types';
import { Screen } from '@/components/Screen';
import { ChoiceChipRow, PrimaryButton, TextField } from '@/components/forms';
import { SectionLabel } from '@/components/atoms';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/auth';
import { createTwinFromProfile } from '@/lib/twin';
import { colors, fonts, spacing } from '@/design/tokens';

const keywordOptions = ['慢热', '高共情', '夜间思考者', '重视真实感', '好奇心强', '直接表达'];
const interestOptions = ['城市夜行', '独立音乐', '心理学', '影像叙事', '咖啡馆', '旅行观察'];
const valueOptions = ['真实感', '边界感', '长期信任', '精神共鸣', '行动一致', '轻松相处'];
const mysticOptions = ['月亮感', '深夜直觉', '火象能量', '水象共情', '风象好奇', '土象稳定'];

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function TwinCreate() {
  const router = useRouter();
  const baseProfile = useAuthStore((s) => s.profile);
  const token = useAuthStore((s) => s.token);
  const setProfileTwin = useAuthStore((s) => s.setProfileTwin);
  const setSession = useAuthStore((s) => s.setSession);

  const [nickname, setNickname] = useState(baseProfile.nickname);
  const [intention, setIntention] = useState(baseProfile.relationshipIntention);
  const [keywords, setKeywords] = useState<string[]>(baseProfile.personalityKeywords);
  const [interests, setInterests] = useState<string[]>(baseProfile.interests);
  const [mbti, setMbti] = useState(baseProfile.mbti ?? '');
  const [zodiac, setZodiac] = useState(baseProfile.zodiac ?? '');
  const [communicationStyle, setCommunicationStyle] = useState(baseProfile.communicationStyle ?? '');
  const [values, setValues] = useState<string[]>(baseProfile.values ?? []);
  const [mysticTags, setMysticTags] = useState<string[]>(baseProfile.mysticTags ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = nickname.trim().length > 0 && intention.trim().length > 3 && keywords.length > 0;

  const submit = async () => {
    if (!canSubmit || saving) return;
    const baseSignals = baseProfile.optionalSignals.filter(
      (signal) => !signal.startsWith('沟通方式:') && !signal.startsWith('重视:'),
    );
    const profile: UserProfile = {
      ...baseProfile,
      nickname: nickname.trim(),
      relationshipIntention: intention.trim(),
      personalityKeywords: keywords,
      interests,
      mbti: mbti.trim() || undefined,
      zodiac: zodiac.trim() || undefined,
      communicationStyle: communicationStyle.trim() || undefined,
      values,
      mysticTags,
      optionalSignals: [
        ...baseSignals,
        ...(communicationStyle.trim() ? [`沟通方式:${communicationStyle.trim()}`] : []),
        ...(values.length ? [`重视:${values.join('、')}`] : []),
      ],
    };
    const twin = createTwinFromProfile(profile);
    setSaving(true);
    setError(null);
    try {
      if (token) {
        const body: ProfileTwinRequest = { profile, twin };
        const { data } = await api.put<MeResponse>('/auth/me/profile', body);
        await setSession({ token, user: data.user, profile: data.profile, twin: data.twin });
        queryClient.clear();
      } else {
        await setProfileTwin(profile, twin);
      }
      router.push('/twin-generating');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '分身保存失败,请检查网络后重试。';
      setError(Array.isArray(message) ? message[0] : String(message));
    } finally {
      setSaving(false);
    }
  };

  const previewLine =
    [...keywords.slice(0, 2), ...values.slice(0, 1), mbti.trim()].filter(Boolean).join(' / ') || '等待人格线索';

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
            <Feather name="chevron-left" size={22} color={colors.textSoft} />
          </Pressable>

          <View style={styles.hero}>
            <Text style={styles.step}>Step 01</Text>
            <Text style={styles.title}>让分身理解你如何靠近一段关系。</Text>
          </View>

          <TextField label="昵称" value={nickname} onChangeText={setNickname} placeholder="你的昵称" autoCapitalize="sentences" />
          <TextField
            label="关系倾向"
            value={intention}
            onChangeText={setIntention}
            placeholder="例如:想遇见一个可以自然聊深的人"
            multiline
            autoCapitalize="sentences"
          />

          <View style={styles.group}>
            <SectionLabel>人格关键词</SectionLabel>
            <ChoiceChipRow options={keywordOptions} selected={keywords} onToggle={(v) => setKeywords((l) => toggle(l, v))} />
          </View>

          <View style={styles.group}>
            <SectionLabel>兴趣线索</SectionLabel>
            <ChoiceChipRow options={interestOptions} selected={interests} onToggle={(v) => setInterests((l) => toggle(l, v))} />
          </View>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <TextField label="MBTI" value={mbti} onChangeText={(t) => setMbti(t.toUpperCase())} placeholder="如 INFJ" autoCapitalize="characters" />
            </View>
            <View style={styles.rowItem}>
              <TextField label="星座" value={zodiac} onChangeText={setZodiac} placeholder="如 双鱼" autoCapitalize="sentences" />
            </View>
          </View>

          <TextField
            label="沟通方式"
            value={communicationStyle}
            onChangeText={setCommunicationStyle}
            placeholder="例如:先观察,再用具体细节靠近"
            multiline
            autoCapitalize="sentences"
          />

          <View style={styles.group}>
            <SectionLabel>价值观标签</SectionLabel>
            <ChoiceChipRow options={valueOptions} selected={values} onToggle={(v) => setValues((l) => toggle(l, v))} />
          </View>

          <View style={styles.group}>
            <SectionLabel>叙事信号</SectionLabel>
            <ChoiceChipRow options={mysticOptions} selected={mysticTags} onToggle={(v) => setMysticTags((l) => toggle(l, v))} />
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>即将生成</Text>
            <Text style={styles.previewName}>{nickname || '你'} 的 DreamTwins</Text>
            <Text style={styles.previewLine}>{previewLine}</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label={saving ? '正在保存…' : '生成我的 AI 分身'}
            icon="zap"
            onPress={submit}
            disabled={!canSubmit}
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  hero: {
    gap: 8,
    marginBottom: spacing.xs,
  },
  step: {
    fontFamily: fonts.sans,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.secondary,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.text,
  },
  group: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  preview: {
    gap: 6,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.panelSofter,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  previewLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muted,
  },
  previewName: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  previewLine: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.aura,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.danger,
  },
});
