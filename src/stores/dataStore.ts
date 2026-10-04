import { create } from 'zustand';
import type { Chapter, Card, GrammarInfo } from '../types';
import { parseGrammar } from '../lib/grammarParser';
import { supabase } from '../lib/supabase';

interface CardOverride {
  pos: string;
  grammar: GrammarInfo;
}

export interface SaveResult {
  ok: boolean;
  error?: string;
}

interface DataState {
  chapters: Chapter[];
  allCards: Card[];
  grammarOverrides: Record<string, CardOverride>;
  searchStudyCardIds: string[];
  isLoading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  setCardGrammarOverride: (cardId: string, pos: string, grammar: GrammarInfo) => Promise<SaveResult>;
  setSearchStudyPool: (cardIds: string[]) => void;
}

export const CHAPTER_SLUGS = [
  "ch1", "ch2a", "ch2b", "ch2c", "ch3", "ch4",
  "ch5a", "ch5b", "ch6a", "ch6b", "ch7",
  "ch8a", "ch8b", "ch9",
  "ch10a", "ch10b", "ch10c", "ch11", "ch12", "ch13",
  "ch14a", "ch14b", "ch15a", "ch15b",
  "ch16a", "ch16b", "ch17a", "ch17b", "ch17c",
  "ch18a", "ch18b", "ch18c", "ch19a", "ch19b",
  "ch20", "ch21", "ch22a", "ch22b", "ch23",
  "ch24a", "ch24b", "ch25", "ch26", "ch27",
  "ch28a", "ch28b", "ch29a", "ch29b", "ch29c",
  "ch30a", "ch30b", "ch30c", "ch31"
];

export const CHAPTER_PARTS: Record<number, string[]> = {
  1: ["ch1", "ch2a", "ch2b", "ch2c", "ch3", "ch4", "ch5a", "ch5b", "ch6a", "ch6b", "ch7", "ch8a", "ch8b", "ch9"],
  2: ["ch10a", "ch10b", "ch10c", "ch11", "ch12", "ch13", "ch14a", "ch14b", "ch15a", "ch15b", "ch16a", "ch16b", "ch17a", "ch17b", "ch17c", "ch18a", "ch18b", "ch18c", "ch19a", "ch19b", "ch20"],
  3: ["ch21", "ch22a", "ch22b", "ch23", "ch24a", "ch24b", "ch25", "ch26", "ch27", "ch28a", "ch28b", "ch29a", "ch29b", "ch29c", "ch30a", "ch30b", "ch30c", "ch31"],
};

// Last successfully fetched community classifications, so the app still shows
// them when the user is offline or Supabase is unreachable.
const OVERRIDE_CACHE_KEY = 'disce-community-overrides-cache';

async function fetchCommunityOverrides(): Promise<Record<string, CardOverride>> {
  try {
    const { data, error } = await supabase
      .from('community_classifications')
      .select('card_id, pos, grammar');
    if (error) throw error;

    const map: Record<string, CardOverride> = {};
    (data ?? []).forEach((row) => {
      map[row.card_id] = { pos: row.pos, grammar: (row.grammar ?? {}) as GrammarInfo };
    });
    try {
      localStorage.setItem(OVERRIDE_CACHE_KEY, JSON.stringify(map));
    } catch { /* storage full / disabled: not fatal */ }
    return map;
  } catch (e) {
    console.warn('Could not load community classifications, using cached copy.', e);
    try {
      const cached = localStorage.getItem(OVERRIDE_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }
}

export const useDataStore = create<DataState>((set, get) => ({
  chapters: [],
  allCards: [],
  grammarOverrides: {},
  searchStudyCardIds: [],
  isLoading: false,
  error: null,

  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      // The old, device-only override store is replaced by the shared database.
      localStorage.removeItem('disce-grammar-overrides');

      const overridesPromise = fetchCommunityOverrides();

      const chapterResults = await Promise.all(
        CHAPTER_SLUGS.map(async (slug) => {
          const response = await fetch(`./data/${slug}.json`);
          if (!response.ok) throw new Error(`Failed to load ${slug}`);
          const data: Chapter = await response.json();
          return { slug, data };
        })
      );
      const overrides = await overridesPromise;

      const cardsAccumulator: Card[] = [];
      chapterResults.forEach(({ slug, data }) => {
        Object.entries(data.categories).forEach(([catSlug, cat]) => {
          cat.cards.forEach((card, index) => {
            const cardId = `${slug}_${catSlug}_${index}`;
            card.id = cardId;

            const override = overrides[cardId];
            if (override) {
              card.partOfSpeech = override.pos;
              card.grammar = override.grammar;
            } else {
              const { pos, grammar } = parseGrammar(card.term, catSlug);
              card.partOfSpeech = pos;
              card.grammar = grammar;
            }
            cardsAccumulator.push(card);
          });
        });
      });

      set({
        chapters: chapterResults.map((r) => r.data),
        allCards: cardsAccumulator,
        grammarOverrides: overrides,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load data', isLoading: false });
    }
  },

  // Writes to the shared database first, so "Save for Everyone" is only
  // reported as successful if it really was saved for everyone.
  setCardGrammarOverride: async (cardId, pos, grammar) => {
    const { error } = await supabase
      .from('community_classifications')
      .upsert(
        { card_id: cardId, pos, grammar, updated_at: new Date().toISOString() },
        { onConflict: 'card_id' }
      );
    if (error) {
      return { ok: false, error: error.message };
    }

    const overrides = { ...get().grammarOverrides, [cardId]: { pos, grammar } };
    const patch = (c: Card): Card => (c.id === cardId ? { ...c, partOfSpeech: pos, grammar } : c);

    set({
      grammarOverrides: overrides,
      allCards: get().allCards.map(patch),
      chapters: get().chapters.map((ch) => ({
        ...ch,
        categories: Object.fromEntries(
          Object.entries(ch.categories).map(([key, cat]) => [
            key,
            { ...cat, cards: cat.cards.map(patch) },
          ])
        ),
      })),
    });

    try {
      localStorage.setItem(OVERRIDE_CACHE_KEY, JSON.stringify(overrides));
    } catch { /* not fatal */ }

    return { ok: true };
  },

  setSearchStudyPool: (cardIds: string[]) => {
    set({ searchStudyCardIds: cardIds });
  },
}));
