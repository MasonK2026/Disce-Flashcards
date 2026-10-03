import { create } from 'zustand';
import type { Chapter, Card, GrammarInfo } from '../types';
import { parseGrammar } from '../lib/grammarParser';

interface CardOverride {
  pos: string;
  grammar: GrammarInfo;
}

interface DataState {
  chapters: Chapter[];
  allCards: Card[];
  grammarOverrides: Record<string, CardOverride>;
  searchStudyCardIds: string[];
  isLoading: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  setCardGrammarOverride: (cardId: string, pos: string, grammar: GrammarInfo) => void;
  exportOverridesJson: () => string;
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
      // 1. Load community overrides from public file (if exists) & localStorage
      let initialOverrides: Record<string, CardOverride> = {};
      try {
        const local = localStorage.getItem('disce-grammar-overrides');
        if (local) {
          initialOverrides = JSON.parse(local);
        }
      } catch (e) {
        console.error('Failed to load local overrides', e);
      }

      try {
        const resp = await fetch('./data/grammar-overrides.json');
        if (resp.ok) {
          const remoteOverrides = await resp.json();
          initialOverrides = { ...remoteOverrides, ...initialOverrides };
        }
      } catch {
        // file may not exist yet, that's fine
      }

      const cardsAccumulator: Card[] = [];
      const chapterPromises = CHAPTER_SLUGS.map(async (slug) => {
        const response = await fetch(`./data/${slug}.json`);
        if (!response.ok) throw new Error(`Failed to load ${slug}`);
        const data: Chapter = await response.json();
        
        Object.entries(data.categories).forEach(([catSlug, cat]) => {
          cat.cards.forEach((card, index) => {
            const cardId = `${slug}_${catSlug}_${index}`;
            card.id = cardId;

            // Check if manual override exists
            if (initialOverrides[cardId]) {
              card.partOfSpeech = initialOverrides[cardId].pos;
              card.grammar = initialOverrides[cardId].grammar;
            } else {
              const { pos, grammar } = parseGrammar(card.term, catSlug);
              card.partOfSpeech = pos;
              card.grammar = grammar;
            }
            cardsAccumulator.push(card);
          });
        });
        return data;
      });
      const chaptersData = await Promise.all(chapterPromises);
      set({ 
        chapters: chaptersData, 
        allCards: cardsAccumulator, 
        grammarOverrides: initialOverrides,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load data', isLoading: false });
    }
  },

  setCardGrammarOverride: (cardId: string, pos: string, grammar: GrammarInfo) => {
    const currentOverrides = { ...get().grammarOverrides, [cardId]: { pos, grammar } };
    
    // Persist to local storage
    try {
      localStorage.setItem('disce-grammar-overrides', JSON.stringify(currentOverrides));
    } catch (e) {
      console.error('Failed to save override to localStorage', e);
    }

    // Update in-memory cards
    const updatedCards = get().allCards.map(c => {
      if (c.id === cardId) {
        return { ...c, partOfSpeech: pos, grammar };
      }
      return c;
    });

    const updatedChapters = get().chapters.map(ch => {
      const updatedCategories = { ...ch.categories };
      Object.keys(updatedCategories).forEach(catKey => {
        updatedCategories[catKey] = {
          ...updatedCategories[catKey],
          cards: updatedCategories[catKey].cards.map(c => {
            if (c.id === cardId) {
              return { ...c, partOfSpeech: pos, grammar };
            }
            return c;
          }),
        };
      });
      return { ...ch, categories: updatedCategories };
    });

    set({
      grammarOverrides: currentOverrides,
      allCards: updatedCards,
      chapters: updatedChapters,
    });
  },

  exportOverridesJson: () => {
    return JSON.stringify(get().grammarOverrides, null, 2);
  },

  setSearchStudyPool: (cardIds: string[]) => {
    set({ searchStudyCardIds: cardIds });
  },
}));
