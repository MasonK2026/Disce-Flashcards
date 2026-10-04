import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDeckStore } from '../stores/deckStore';
import { useDataStore } from '../stores/dataStore';
import { normalizeLatinSearch } from '../lib/latinNormalize';
import { GrammarBadge } from '../components/grammar/GrammarBadge';
import { ArrowLeft, Play, Plus, Trash2, Search, Sparkles, Layers } from 'lucide-react';
import { CustomCardModal } from '../components/deck/CustomCardModal';
import { BulkAddModal } from '../components/deck/BulkAddModal';
import type { Card } from '../types';

export function DeckDetailPage() {
  const { id } = useParams();
  const { decks, customCards, addCardToDeck, removeCardFromDeck, renameDeck } = useDeckStore();
  const { allCards } = useDataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [deckName, setDeckName] = useState('');

  const deck = useMemo(() => decks.find(d => d.id === id), [decks, id]);

  // Combined pool of all available cards (official + custom)
  const allAvailableCards = useMemo(() => {
    return [...allCards, ...customCards];
  }, [allCards, customCards]);

  // Cards currently in this deck
  const deckCards = useMemo(() => {
    if (!deck) return [];
    return deck.cardIds
      .map(cardId => allAvailableCards.find(c => c.id === cardId))
      .filter((c): c is Card => c !== undefined);
  }, [deck, allAvailableCards]);

  // Search results for adding new cards to the deck
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !deck) return [];

    const normQuery = normalizeLatinSearch(searchQuery.trim());
    const lowerQuery = searchQuery.toLowerCase().trim();

    return allAvailableCards
      .filter(card => !deck.cardIds.includes(card.id))
      .filter(card => {
        const normTerm = normalizeLatinSearch(card.term);
        const lowerDef = card.definition.toLowerCase();
        return normTerm.includes(normQuery) || lowerDef.includes(lowerQuery);
      })
      .slice(0, 15);
  }, [searchQuery, allAvailableCards, deck]);

  if (!deck) {
    return (
      <div className="p-12 text-center space-y-3">
        <h2 className="text-xl font-bold">Deck Not Found</h2>
        <Link to="/decks" className="text-primary hover:underline text-sm font-medium">
          ← Back to Decks
        </Link>
      </div>
    );
  }

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (deckName.trim()) {
      renameDeck(deck.id, deckName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center space-x-3">
          <Link to="/decks" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center space-x-2">
                <input
                  type="text"
                  autoFocus
                  defaultValue={deck.name}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="px-2.5 py-1 text-2xl font-bold rounded-lg border bg-background"
                />
                <button type="submit" className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                  Save
                </button>
              </form>
            ) : (
              <h1 
                onClick={() => { setDeckName(deck.name); setIsEditingName(true); }}
                className="text-3xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition"
                title="Click to rename"
              >
                {deck.name}
              </h1>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{deckCards.length} vocabulary words</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setIsBulkAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-primary/40 bg-background text-foreground font-semibold hover:bg-muted transition text-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Add from...</span>
          </button>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Add Custom Word</span>
          </button>

          <Link
            to={`/study/${deck.id}`}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
              deckCards.length > 0
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground/50 pointer-events-none'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Study Deck ({deckCards.length})</span>
          </Link>
        </div>
      </div>

      {/* Add Words from Library Search */}
      <div className="p-5 rounded-2xl border bg-card/60 shadow-sm space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Search Library to Add Words
        </label>
        <div className="flex items-center px-3 py-2 rounded-xl border bg-background space-x-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Latin (macrons optional) or English definition..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Search Results Dropdown/Grid */}
        {searchResults.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 pt-2 animate-in fade-in">
            {searchResults.map((card) => (
              <div
                key={card.id}
                className="p-3 rounded-lg border bg-background flex items-center justify-between hover:border-primary/50 transition"
              >
                <div>
                  <div className="font-semibold text-sm">{card.term}</div>
                  <div className="text-xs text-muted-foreground">{card.definition}</div>
                </div>
                <button
                  onClick={() => addCardToDeck(deck.id, card.id)}
                  className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition"
                  title="Add to deck"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deck Card List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Cards in this Deck ({deckCards.length})</h2>

        {deckCards.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed text-muted-foreground text-sm space-y-1">
            <p className="font-medium text-foreground">This deck is empty.</p>
            <p>Use the search box above to add words from the Oxford Latin Course, or click "Add Custom Word".</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {deckCards.map((card) => (
              <div key={card.id} className="p-4 rounded-xl border bg-card shadow-sm flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-base text-foreground">{card.term}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{card.definition}</div>
                  </div>
                  <button
                    onClick={() => removeCardFromDeck(deck.id, card.id)}
                    className="p-1 text-muted-foreground/60 hover:text-red-500 transition"
                    title="Remove from deck"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <GrammarBadge grammar={card.grammar} partOfSpeech={card.partOfSpeech} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for adding custom cards */}
      <CustomCardModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        targetDeckId={deck.id}
      />

      <BulkAddModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        targetDeckId={deck.id}
      />
    </div>
  );
}
