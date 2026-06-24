import { Redirect } from 'expo-router';

// Batch 1:demo persona 默认已"登录",直接进今日页。
// 后续接入鉴权后,这里改成:有 user → tabs,否则 → /onboarding。
export default function Index() {
  return <Redirect href="/(tabs)/today" />;
}
