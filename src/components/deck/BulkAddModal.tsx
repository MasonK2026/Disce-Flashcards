import { useState, useMemo } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { useUserStore } from '../../stores/userStore';
import { useDeckStore } from '../../stores/deckStore';
import { X, CheckSquare, Square } from 'lucide-react';
import type { Card } from '../../types';

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDeckId: string;
}

export function BulkAddModal({ isOpen, onClose, targetDeckId }: BulkAddModalProps) {
  const { allCards } = useDataStore();
  const { cardProgress } = useUserStore();
  const { decks, customCards, addCardsToDeck } = useDeckStore();

  const [activeTab, setActiveTab] = useState<'favorites' | 'other_decks'>('favorites');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

  // Combined pool of all available cards
  const allAvailableCards = useMemo(() => {
    return [...allCards, ...customCards];
  }, [allCards, customCards]);

  const targetDeck = useMemo(() => decks.find(d => d.id === targetDeckId), [decks, targetDeckId]);

  const cardsInView = useMemo(() => {
    if (activeTab === 'favorites') {
      return allAvailableCards.filter(card => cardProgress[card.id]?.favorite);
    } else {
      if (!selectedDeckId) return [];
      const deck = decks.find(d => d.id === selectedDeckId);
      if (!deck) return [];
      return deck.cardIds
        .map(id => allAvailableCards.find(c => c.id === id))
        .filter((c): c is Card => c !== undefined);
    }
  }, [activeTab, selectedDeckId, allAvailableCards, cardProgress, decks]);

  const allSelected = cardsInView.length > 0 && cardsInView.every(c => selectedCardIds.has(c.id));

  const toggleCard = (id: string) => {
    const next = new Set(selectedCardIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCardIds(next);
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedCardIds(new Set());
    } else {
      const next = new Set(selectedCardIds);
      cardsInView.forEach(c => next.add(c.id));
      setSelectedCardIds(next);
    }
  };

  const handleAdd = () => {
    addCardsToDeck(targetDeckId, Array.from(selectedCardIds));
    setSelectedCardIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  const otherDecks = decks.filter(d => d.id !== targetDeckId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card text-card-foreground w-full max-w-2xl rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Add to {targetDeck?.name}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-muted/20">
          <button
            onClick={() => { setActiveTab('favorites'); setSelectedCardIds(new Set()); }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition ${
              activeTab === 'favorites' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            From Favorites
          </button>
          <button
            onClick={() => { setActiveTab('other_decks'); setSelectedCardIds(new Set()); }}
            className={`flex-1 py-3 text-sm font-semibold text-center transition ${
              activeTab === 'other_decks' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            From Other Decks
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'other_decks' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select a Source Deck</label>
              <select
                value={selectedDeckId}
                onChange={(e) => { setSelectedDeckId(e.target.value); setSelectedCardIds(new Set()); }}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="" disabled>-- Select a deck --</option>
                {otherDecks.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.cardIds.length} cards)</option>
                ))}
              </select>
            </div>
          )}

          {cardsInView.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <button
                  onClick={toggleAll}
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
                >
                  {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                  <span>Select All</span>
                </button>
                <span className="text-xs text-muted-foreground">{selectedCardIds.size} selected</span>
              </div>
              
              <div className="space-y-2">
                {cardsInView.map(card => {
                  const isSelected = selectedCardIds.has(card.id);
                  const isAlreadyInDeck = targetDeck?.cardIds.includes(card.id);
                  return (
                    <div 
                      key={card.id}
                      onClick={() => !isAlreadyInDeck && toggleCard(card.id)}
                      className={`flex items-center p-3 rounded-xl border transition ${
                        isAlreadyInDeck ? 'opacity-50 bg-muted cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 bg-background'
                      }`}
                    >
                      <div className="mr-3">
                        {isAlreadyInDeck ? (
                          <CheckSquare className="w-4 h-4 text-muted-foreground" />
                        ) : isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm flex items-center space-x-2">
                          <span>{card.term}</span>
                          {isAlreadyInDeck && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">Already in deck</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{card.definition}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {activeTab === 'favorites' 
                ? 'No favorites found. Star some cards first!' 
                : !selectedDeckId ? 'Please select a deck above.' : 'This deck is empty.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl text-muted-foreground hover:text-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedCardIds.size === 0}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 shadow-sm"
          >
            Add {selectedCardIds.size > 0 ? selectedCardIds.size : ''} Cards
          </button>
        </div>
      </div>
    </div>
  );
}
