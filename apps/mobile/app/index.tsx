import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

// 已登录或已完成引导 → 今日;否则 → 引导(欢迎)页。
export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const onboarded = useAuthStore((s) => s.onboarded);

  if (!hydrated) return null; // 等待持久化会话恢复(splash 期间)
  if (token || onboarded) return <Redirect href="/(tabs)/today" />;
  return <Redirect href="/onboarding" />;
}
