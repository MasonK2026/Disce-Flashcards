import { useState } from 'react';
import { useDeckStore } from '../stores/deckStore';
import { Link } from 'react-router-dom';
import { Layers, Plus, Trash2, Play, Sparkles } from 'lucide-react';
import { CustomCardModal } from '../components/deck/CustomCardModal';
import { GrammarBadge } from '../components/grammar/GrammarBadge';

export function DecksPage() {
  const { decks, customCards, createDeck, deleteDeck, deleteCustomCard } = useDeckStore();
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [isCustomCardModalOpen, setIsCustomCardModalOpen] = useState(false);

  const handleCreateDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    createDeck(newDeckName);
    setNewDeckName('');
    setIsCreatingDeck(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Custom Decks & Vocabulary</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build custom review sets or add your own words with grammar tags.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCustomCardModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-primary/40 bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Add Custom Word</span>
          </button>

          <button
            onClick={() => setIsCreatingDeck(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Deck</span>
          </button>
        </div>
      </div>

      {/* New Deck Inline Form */}
      {isCreatingDeck && (
        <form onSubmit={handleCreateDeck} className="p-4 rounded-xl border bg-card shadow-sm flex items-center gap-3 animate-in fade-in">
          <Layers className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            autoFocus
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="Deck name (e.g. Midterm Verbs, Hard Words)..."
            className="flex-1 px-3 py-1.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingDeck(false)}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Decks Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Your Decks ({decks.length})</h2>

        {decks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed text-muted-foreground text-sm space-y-2">
            <p className="font-semibold text-foreground">No custom decks yet.</p>
            <p>Click "New Deck" to organize your vocabulary for tests, reviews, or chapters.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <div key={deck.id} className="p-5 rounded-2xl border bg-card shadow-sm hover:border-primary/40 transition flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-lg text-foreground truncate">{deck.name}</h3>
                    <button
                      onClick={() => deleteDeck(deck.id)}
                      className="p-1 rounded text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Delete deck"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {deck.cardIds.length} {deck.cardIds.length === 1 ? 'card' : 'cards'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Link
                    to={`/decks/${deck.id}`}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                  >
                    Edit Deck →
                  </Link>

                  <Link
                    to={`/study/${deck.id}`}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      deck.cardIds.length > 0
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                        : 'bg-muted text-muted-foreground/50 pointer-events-none'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Study ({deck.cardIds.length})</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Created Custom Cards */}
      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Custom Cards ({customCards.length})</h2>
            <p className="text-xs text-muted-foreground">Words you created manually that are not in the standard 53 chapters.</p>
          </div>
        </div>

        {customCards.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed text-muted-foreground text-sm">
            You haven't created any custom words yet. Click "Add Custom Word" above to add vocabulary from other readings.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {customCards.map((card) => (
              <div key={card.id} className="p-4 rounded-xl border bg-card shadow-sm flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-base text-foreground">{card.term}</span>
                    <button
                      onClick={() => deleteCustomCard(card.id)}
                      className="text-muted-foreground/60 hover:text-red-500 transition"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{card.definition}</p>
                </div>

                <div className="pt-2">
                  <GrammarBadge grammar={card.grammar} partOfSpeech={card.partOfSpeech} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <CustomCardModal
        isOpen={isCustomCardModalOpen}
        onClose={() => setIsCustomCardModalOpen(false)}
      />
    </div>
  );
}
