import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Deck, Card } from '../types';

interface DeckState {
  decks: Deck[];
  customCards: Card[];
  createDeck: (name: string) => Deck;
  duplicateDeck: (deckId: string) => Deck | undefined;
  deleteDeck: (deckId: string) => void;
  renameDeck: (deckId: string, newName: string) => void;
  addCardToDeck: (deckId: string, cardId: string) => void;
  addCardsToDeck: (deckId: string, cardIds: string[]) => void;
  removeCardFromDeck: (deckId: string, cardId: string) => void;
  createCustomCard: (card: Omit<Card, 'id'>) => Card;
  updateCustomCard: (cardId: string, patch: Partial<Card>) => void;
  deleteCustomCard: (cardId: string) => void;
}

export const useDeckStore = create<DeckState>()(
  persist(
    (set, get) => ({
      decks: [
        {
          id: 'deck_verbs_part1',
          name: 'Midterm Verbs Focus',
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

      duplicateDeck: (deckId: string) => {
        const sourceDeck = get().decks.find(d => d.id === deckId);
        if (!sourceDeck) return undefined;
        
        const newDeck: Deck = {
          id: `deck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: `${sourceDeck.name} (Copy)`,
          cardIds: [...sourceDeck.cardIds],
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

      addCardsToDeck: (deckId: string, cardIds: string[]) => {
        set((state) => ({
          decks: state.decks.map(d => {
            if (d.id === deckId) {
              const newCardIds = cardIds.filter(id => !d.cardIds.includes(id));
              return { ...d, cardIds: [...d.cardIds, ...newCardIds] };
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
