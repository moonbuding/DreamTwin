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
  onboarded: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  profile: UserProfile;
  twin: TwinProjection;
  onboarded: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: Omit<PersistedSession, 'onboarded'>) => Promise<void>;
  setProfileTwin: (profile: UserProfile, twin: TwinProjection) => Promise<void>;
  completeOnboarding: () => Promise<void>;
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
  onboarded: false,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await storage.getItemAsync(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedSession;
        set({
          token: parsed.token,
          user: parsed.user,
          profile: parsed.profile,
          twin: parsed.twin,
          onboarded: parsed.onboarded ?? Boolean(parsed.token),
        });
      }
    } catch {
      // ignore — 保留 demo 默认
    } finally {
      set({ hydrated: true });
    }
  },
  setSession: async (session) => {
    set({ token: session.token, user: session.user, profile: session.profile, twin: session.twin, onboarded: true });
    await persist({ ...session, onboarded: true });
  },
  setProfileTwin: async (profile, twin) => {
    const { token, user } = get();
    set({ profile, twin });
    if (user) await persist({ token, user, profile, twin, onboarded: get().onboarded });
  },
  completeOnboarding: async () => {
    const { token, user, profile, twin } = get();
    set({ onboarded: true });
    if (user) await persist({ token, user, profile, twin, onboarded: true });
  },
  updateProfile: async (patch) => {
    const { token, user, twin, onboarded } = get();
    const next = { ...get().profile, ...patch };
    set({ profile: next });
    if (user) await persist({ token, user, profile: next, twin, onboarded });
  },
  updateTwin: async (patch) => {
    const { token, user, profile, onboarded } = get();
    const next = { ...get().twin, ...patch };
    set({ twin: next });
    if (user) await persist({ token, user, profile, twin: next, onboarded });
  },
  clear: async () => {
    try {
      await storage.deleteItemAsync(KEY);
    } catch {
      // ignore
    }
    set({ token: null, user: demoUser, profile: demoProfile, twin: demoTwin, onboarded: false });
  },
}));
