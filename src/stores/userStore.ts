import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardProgress } from '../types';
import { CHAPTER_SLUGS } from './dataStore';

interface UserSession {
  source: string;
  label: string;
  index: number;
}

interface UserState {
  pin: string | null;
  lastSynced: number;
  lastStudySession: UserSession | null;
  settings: {
    activeChapters: string[];
    defaultDirection: 'LA-EN' | 'EN-LA';
  };
  cardProgress: Record<string, CardProgress>;
  toggleMemorized: (cardId: string) => void;
  toggleFavorite: (cardId: string) => void;
  setDirection: (dir: 'LA-EN' | 'EN-LA') => void;
  toggleChapter: (chapterSlug: string) => void;
  setActiveChapters: (chapters: string[]) => void;
  selectAllChapters: () => void;
  deselectAllChapters: () => void;
  setLastStudySession: (session: UserSession | null) => void;
  updateStudySessionIndex: (index: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      pin: null,
      lastSynced: 0,
      lastStudySession: null,
      settings: {
        activeChapters: CHAPTER_SLUGS, // All active by default
        defaultDirection: 'LA-EN',
      },
      cardProgress: {},
      setLastStudySession: (session) => set({ lastStudySession: session }),
      updateStudySessionIndex: (index) => set((state) => ({
        lastStudySession: state.lastStudySession 
          ? { ...state.lastStudySession, index }
          : null
      })),
      toggleMemorized: (cardId) =>
        set((state) => ({
          cardProgress: {
            ...state.cardProgress,
            [cardId]: {
              ...(state.cardProgress[cardId] || { memorized: false, favorite: false, srsBox: 1, lastReview: '' }),
              memorized: !(state.cardProgress[cardId]?.memorized || false),
            },
          },
        })),
      toggleFavorite: (cardId) =>
        set((state) => ({
          cardProgress: {
            ...state.cardProgress,
            [cardId]: {
              ...(state.cardProgress[cardId] || { memorized: false, favorite: false, srsBox: 1, lastReview: '' }),
              favorite: !(state.cardProgress[cardId]?.favorite || false),
            },
          },
        })),
      setDirection: (dir) => set((state) => ({ settings: { ...state.settings, defaultDirection: dir } })),
      toggleChapter: (chapterSlug) =>
        set((state) => {
          const current = state.settings.activeChapters;
          const next = current.includes(chapterSlug)
            ? current.filter(c => c !== chapterSlug)
            : [...current, chapterSlug];
          return { settings: { ...state.settings, activeChapters: next } };
        }),
      setActiveChapters: (chapters) =>
        set((state) => ({ settings: { ...state.settings, activeChapters: chapters } })),
      selectAllChapters: () =>
        set((state) => ({ settings: { ...state.settings, activeChapters: CHAPTER_SLUGS } })),
      deselectAllChapters: () =>
        set((state) => ({ settings: { ...state.settings, activeChapters: [] } })),
    }),
    {
      name: 'disce-user-storage',
    }
  )
);
