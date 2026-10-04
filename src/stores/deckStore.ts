import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Deck, Card } from '../types';

interface DeckState {
  decks: Deck[];
  customCards: Card[];
  createDeck: (name: string) => Deck;
  deleteDeck: (deckId: string) => void;
  renameDeck: (deckId: string, newName: string) => void;
  addCardToDeck: (deckId: string, cardId: string) => void;
  removeCardFromDeck: (deckId: string, cardId: string) => void;
  createCustomCard: (card: Omit<Card, 'id'>) => Card;
  updateCustomCard: (cardId: string, patch: Partial<Card>) => void;
  deleteCustomCard: (cardId: string) => void;
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set) => ({
      decks: [
        {
          id: 'deck_verbs_part1',
          name: 'Part I Verbs Focus',
          cardIds: [],
        },
      ],
      customCards: [],

      createDeck: (name: string) => {
        const newDeck: Deck = {
          id: `deck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: name.trim() || 'Untitled Deck',
          cardIds: [],
        };
        set((state) => ({ decks: [...state.decks, newDeck] }));
        return newDeck;
      },

      deleteDeck: (deckId: string) => {
        set((state) => ({ decks: state.decks.filter(d => d.id !== deckId) }));
      },

      renameDeck: (deckId: string, newName: string) => {
        set((state) => ({
          decks: state.decks.map(d => d.id === deckId ? { ...d, name: newName } : d),
        }));
      },

      addCardToDeck: (deckId: string, cardId: string) => {
        set((state) => ({
          decks: state.decks.map(d => {
            if (d.id === deckId && !d.cardIds.includes(cardId)) {
              return { ...d, cardIds: [...d.cardIds, cardId] };
            }
            return d;
          }),
        }));
      },

      removeCardFromDeck: (deckId: string, cardId: string) => {
        set((state) => ({
          decks: state.decks.map(d => {
            if (d.id === deckId) {
              return { ...d, cardIds: d.cardIds.filter(id => id !== cardId) };
            }
            return d;
          }),
        }));
      },

      createCustomCard: (cardData: Omit<Card, 'id'>) => {
        const newCard: Card = {
          ...cardData,
          id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        };
        set((state) => ({ customCards: [...state.customCards, newCard] }));
        return newCard;
      },

      updateCustomCard: (cardId: string, patch: Partial<Card>) => {
        set((state) => ({
          customCards: state.customCards.map(c => c.id === cardId ? { ...c, ...patch, id: c.id } : c),
        }));
      },

      deleteCustomCard: (cardId: string) => {
        set((state) => ({
          customCards: state.customCards.filter(c => c.id !== cardId),
          decks: state.decks.map(d => ({
            ...d,
            cardIds: d.cardIds.filter(id => id !== cardId),
          })),
        }));
      },
    }),
    {
      name: 'disce-decks-storage',
    }
  )
);
