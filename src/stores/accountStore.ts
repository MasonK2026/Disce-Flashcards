import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useUserStore } from './userStore';
import { useDeckStore } from './deckStore';
import { CHAPTER_SLUGS } from './dataStore';

/**
 * PIN accounts. There is no password or email: creating an account returns a
 * 6-digit PIN, and the PIN is the only credential. All access to the
 * `user_profiles` table goes through the RPCs in supabase/schema.sql.
 */

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface ProfileData {
  version: 1;
  settings: ReturnType<typeof useUserStore.getState>['settings'];
  cardProgress: ReturnType<typeof useUserStore.getState>['cardProgress'];
  decks: ReturnType<typeof useDeckStore.getState>['decks'];
  customCards: ReturnType<typeof useDeckStore.getState>['customCards'];
}

interface AccountState {
  pin: string | null;
  /** The cloud `updated_at` we last synced with. */
  lastSyncedAt: string | null;
  /** Local changes exist that have not been pushed yet. */
  dirty: boolean;
  status: SyncStatus;
  error: string | null;
  createAccount: () => Promise<boolean>;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  syncFromCloud: () => Promise<void>;
  pushToCloud: () => Promise<boolean>;
}

const PIN_RE = /^\d{6}$/;

/** True while we're writing cloud data into the local stores (avoids push loops). */
let applyingRemote = false;

export function snapshotProfile(): ProfileData {
  const u = useUserStore.getState();
  const d = useDeckStore.getState();
  return {
    version: 1,
    settings: u.settings,
    cardProgress: u.cardProgress,
    decks: d.decks,
    customCards: d.customCards,
  };
}

function applyProfile(data: Partial<ProfileData> | null | undefined) {
  if (!data || typeof data !== 'object') return;
  applyingRemote = true;
  try {
    const user = useUserStore.getState();
    const settings = { ...user.settings };
    if (data.settings && typeof data.settings === 'object') {
      if (Array.isArray(data.settings.activeChapters)) {
        settings.activeChapters = data.settings.activeChapters.filter(c => typeof c === 'string');
      }
      if (data.settings.defaultDirection === 'LA-EN' || data.settings.defaultDirection === 'EN-LA') {
        settings.defaultDirection = data.settings.defaultDirection;
      }
    }
    useUserStore.setState({
      settings,
      cardProgress:
        data.cardProgress && typeof data.cardProgress === 'object' && !Array.isArray(data.cardProgress)
          ? data.cardProgress
          : {},
    });
    useDeckStore.setState({
      decks: Array.isArray(data.decks) ? data.decks : [],
      customCards: Array.isArray(data.customCards) ? data.customCards : [],
    });
  } finally {
    applyingRemote = false;
  }
}

function resetLocalData() {
  applyingRemote = true;
  try {
    useUserStore.setState({
      settings: { activeChapters: CHAPTER_SLUGS, defaultDirection: 'LA-EN' },
      cardProgress: {},
    });
    useDeckStore.setState({ decks: [], customCards: [] });
  } finally {
    applyingRemote = false;
  }
}

function msg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return 'Network error. Please try again.';
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      pin: null,
      lastSyncedAt: null,
      dirty: false,
      status: 'idle',
      error: null,

      createAccount: async () => {
        set({ status: 'syncing', error: null });
        const { data, error } = await supabase.rpc('create_profile', { p_data: snapshotProfile() });
        if (error || !data) {
          set({ status: 'error', error: error ? msg(error) : 'Could not create account.' });
          return false;
        }
        const res = data as { pin: string; updated_at: string };
        set({ pin: res.pin, lastSyncedAt: res.updated_at, dirty: false, status: 'synced', error: null });
        return true;
      },

      login: async (pin) => {
        const clean = pin.trim();
        if (!PIN_RE.test(clean)) {
          set({ status: 'error', error: 'A PIN is exactly 6 digits.' });
          return false;
        }
        set({ status: 'syncing', error: null });
        const { data, error } = await supabase.rpc('get_profile', { p_pin: clean });
        if (error) {
          set({ status: 'error', error: msg(error) });
          return false;
        }
        if (!data) {
          set({ status: 'error', error: 'PIN not found.' });
          return false;
        }
        const res = data as { data: ProfileData; updated_at: string };
        applyProfile(res.data);
        set({ pin: clean, lastSyncedAt: res.updated_at, dirty: false, status: 'synced', error: null });
        return true;
      },

      logout: async () => {
        if (get().pin && get().dirty) {
          const ok = await get().pushToCloud();
          if (!ok) return false; // don't throw away unsynced data
        }
        resetLocalData();
        set({ pin: null, lastSyncedAt: null, dirty: false, status: 'idle', error: null });
        return true;
      },

      syncFromCloud: async () => {
        const { pin, lastSyncedAt, dirty } = get();
        if (!pin) return;
        set({ status: 'syncing', error: null });
        const { data, error } = await supabase.rpc('get_profile', { p_pin: pin });
        if (error) {
          set({ status: 'error', error: msg(error) });
          return;
        }
        if (!data) {
          set({ status: 'error', error: 'This PIN no longer exists in the cloud.' });
          return;
        }
        const res = data as { data: ProfileData; updated_at: string };
        if (res.updated_at !== lastSyncedAt) {
          // Cloud changed since we last synced (e.g. another device): cloud wins.
          applyProfile(res.data);
          set({ lastSyncedAt: res.updated_at, dirty: false, status: 'synced' });
        } else if (dirty) {
          await get().pushToCloud();
        } else {
          set({ status: 'synced' });
        }
      },

      pushToCloud: async () => {
        const { pin } = get();
        if (!pin) return false;
        set({ status: 'syncing', error: null });
        const { data, error } = await supabase.rpc('save_profile', { p_pin: pin, p_data: snapshotProfile() });
        if (error || !data) {
          set({ status: 'error', error: error ? msg(error) : 'Could not save to the cloud.' });
          return false;
        }
        const res = data as { updated_at: string };
        set({ lastSyncedAt: res.updated_at, dirty: false, status: 'synced', error: null });
        return true;
      },
    }),
    {
      name: 'disce-account-storage',
      partialize: (s) => ({ pin: s.pin, lastSyncedAt: s.lastSyncedAt, dirty: s.dirty }),
    }
  )
);

let started = false;

/**
 * Call once at app start. Pulls the latest cloud data (if logged in) and
 * pushes local changes to the cloud shortly after they happen.
 */
export function startAutoSync() {
  if (started) return;
  started = true;

  let timer: ReturnType<typeof setTimeout> | undefined;

  const onLocalChange = () => {
    if (applyingRemote) return;
    const { pin } = useAccountStore.getState();
    if (!pin) return;
    if (!useAccountStore.getState().dirty) useAccountStore.setState({ dirty: true });
    clearTimeout(timer);
    timer = setTimeout(() => {
      void useAccountStore.getState().pushToCloud();
    }, 1500);
  };

  useUserStore.subscribe((state, prev) => {
    if (state.settings !== prev.settings || state.cardProgress !== prev.cardProgress) onLocalChange();
  });
  useDeckStore.subscribe((state, prev) => {
    if (state.decks !== prev.decks || state.customCards !== prev.customCards) onLocalChange();
  });

  // Try to flush if the tab is closing with unsynced changes.
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const { pin, dirty } = useAccountStore.getState();
      if (pin && dirty) void useAccountStore.getState().pushToCloud();
    }
  });

  void useAccountStore.getState().syncFromCloud();
}
