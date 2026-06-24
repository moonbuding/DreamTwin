import Constants from 'expo-constants';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// 自动适配:开发时从 Metro 拿到 Mac 的 LAN IP,让真机能直连到本机 NestJS。
// 生产时退回 app.json extra.apiUrl。
const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
const configured = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const baseURL = envApiUrl
  ? envApiUrl
  : debuggerHost
    ? `http://${debuggerHost}:3001/api`
    : (configured ?? 'http://localhost:3001/api');

export const api = axios.create({
  baseURL,
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
