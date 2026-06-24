// 跨端安全存储:
// - native (iOS/Android): expo-secure-store(钥匙串 / Keystore)
// - web: localStorage 包一层 Promise 接口

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface AsyncStorageLike {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

const webStorage: AsyncStorageLike = {
  async getItemAsync(key) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItemAsync(key, value) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(key, value);
    } catch {
      // 静默忽略(隐私模式 / 配额满)
    }
  },
  async deleteItemAsync(key) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const storage: AsyncStorageLike = Platform.OS === 'web' ? webStorage : SecureStore;
