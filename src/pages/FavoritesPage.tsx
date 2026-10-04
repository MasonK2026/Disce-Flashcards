import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { useUserStore } from '../stores/userStore';
import { useDeckStore } from '../stores/deckStore';
import { ArrowLeft, Play, Search, Trash2, StarOff } from 'lucide-react';
import { GrammarBadge } from '../components/grammar/GrammarBadge';

export function FavoritesPage() {
  const { allCards } = useDataStore();
  const { cardProgress, toggleFavorite } = useUserStore();
  const { customCards } = useDeckStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Combined pool of all available cards
  const allAvailableCards = useMemo(() => {
    return [...allCards, ...customCards];
  }, [allCards, customCards]);

  // Favorites
  const favoriteCards = useMemo(() => {
    return allAvailableCards.filter(card => cardProgress[card.id]?.favorite);
  }, [allAvailableCards, cardProgress]);

  // Filtered by search
  const displayCards = useMemo(() => {
    if (!searchQuery.trim()) return favoriteCards;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return favoriteCards.filter(card => 
      card.term.toLowerCase().includes(lowerQuery) || 
      card.definition.toLowerCase().includes(lowerQuery)
    );
  }, [favoriteCards, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center space-x-3">
          <Link to="/" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Favorites</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{favoriteCards.length} starred words</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/study/favorites"
            className={`flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm ${
              favoriteCards.length > 0
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-muted text-muted-foreground/50 pointer-events-none'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Study Favorites</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3">
          <div className="sticky top-6 p-5 rounded-2xl border bg-card/60 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Search Favorites
            </h2>
            <div className="flex items-center px-3 py-2 rounded-xl border bg-background space-x-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Latin or English..."
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3 space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Your Starred Words</h2>

          {favoriteCards.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed text-muted-foreground text-sm space-y-2">
              <StarOff className="w-12 h-12 mx-auto opacity-20 mb-2" />
              <p className="font-semibold text-foreground text-base">No favorites yet.</p>
              <p>Click the star icon on any flashcard to save words here for later review.</p>
            </div>
          ) : displayCards.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No favorites match your search.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {displayCards.map((card) => (
                <div key={card.id} className="p-4 rounded-xl border bg-card shadow-sm flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-base text-foreground">{card.term}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{card.definition}</div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(card.id)}
                      className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition"
                      title="Unfavorite"
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
      </div>
    </div>
  );
}
