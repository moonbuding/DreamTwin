import { create } from 'zustand';
import type { AuthUser, TwinProjection, UserProfile } from '@dreamtwin/api-types';
import { storage } from '@/lib/storage';
import { demoProfile, demoTwin, demoUser } from '@/lib/demoContent';

const KEY = 'dreamtwin_session_v1';

interface PersistedSession {
  token: string | null;
  user: AuthUser;
  profile: UserProfile;
  twin: TwinProjection;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  profile: UserProfile;
  twin: TwinProjection;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: PersistedSession) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updateTwin: (patch: Partial<TwinProjection>) => Promise<void>;
  clear: () => Promise<void>;
}

async function persist(state: PersistedSession) {
  try {
    await storage.setItemAsync(KEY, JSON.stringify(state));
  } catch {
    // 持久化失败也保留内存态,让本次会话可用
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 默认即 demo persona,让旗舰页面在后端接入前就能渲染(对齐 legacy web 本地 demo)
  user: demoUser,
  token: null,
  profile: demoProfile,
  twin: demoTwin,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await storage.getItemAsync(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedSession;
        set({ token: parsed.token, user: parsed.user, profile: parsed.profile, twin: parsed.twin });
      }
    } catch {
      // ignore — 保留 demo 默认
    } finally {
      set({ hydrated: true });
    }
  },
  setSession: async (session) => {
    set({ token: session.token, user: session.user, profile: session.profile, twin: session.twin });
    await persist(session);
  },
  updateProfile: async (patch) => {
    const { token, user, profile, twin } = get();
    const next = { ...profile, ...patch };
    set({ profile: next });
    if (user) await persist({ token, user, profile: next, twin });
  },
  updateTwin: async (patch) => {
    const { token, user, profile, twin } = get();
    const next = { ...twin, ...patch };
    set({ twin: next });
    if (user) await persist({ token, user, profile, twin: next });
  },
  clear: async () => {
    try {
      await storage.deleteItemAsync(KEY);
    } catch {
      // ignore
    }
    set({ token: null, user: demoUser, profile: demoProfile, twin: demoTwin });
  },
}));
