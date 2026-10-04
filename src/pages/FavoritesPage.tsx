import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { useUserStore } from '../stores/userStore';
import { useDeckStore } from '../stores/deckStore';
import { normalizeLatinSearch } from '../lib/latinNormalize';
import { ArrowLeft, Play, Search, Trash2, StarOff, Star, X } from 'lucide-react';
import { GrammarBadge } from '../components/grammar/GrammarBadge';
import type { Card } from '../types';

export function FavoritesPage() {
  const { allCards, chapters, isLoading, loadData } = useDataStore();
  const { cardProgress, toggleFavorite } = useUserStore();
  const { customCards } = useDeckStore();

  useEffect(() => {
    if (chapters.length === 0 && !isLoading) {
      loadData();
    }
  }, [chapters, isLoading, loadData]);

  const [addQuery, setAddQuery] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Combined pool of all available cards
  const allAvailableCards = useMemo(() => {
    return [...allCards, ...customCards];
  }, [allCards, customCards]);

  // Favorites
  const favoriteCards = useMemo(() => {
    return allAvailableCards.filter(card => cardProgress[card.id]?.favorite);
  }, [allAvailableCards, cardProgress]);

  // Search library to add new favorites
  const librarySearchResults = useMemo(() => {
    if (!addQuery.trim()) return [];
    const normQuery = normalizeLatinSearch(addQuery.trim());
    const lowerQuery = addQuery.toLowerCase().trim();

    return allAvailableCards
      .filter(card => {
        const normTerm = normalizeLatinSearch(card.term);
        const lowerDef = card.definition.toLowerCase();
        return normTerm.includes(normQuery) || lowerDef.includes(lowerQuery);
      })
      .slice(0, 10);
  }, [addQuery, allAvailableCards]);

  // Filter existing favorites
  const displayFavorites = useMemo(() => {
    if (!filterQuery.trim()) return favoriteCards;
    const normQuery = normalizeLatinSearch(filterQuery.trim());
    const lowerQuery = filterQuery.toLowerCase().trim();
    return favoriteCards.filter(card => {
      const normTerm = normalizeLatinSearch(card.term);
      const lowerDef = card.definition.toLowerCase();
      return normTerm.includes(normQuery) || lowerDef.includes(lowerQuery);
    });
  }, [favoriteCards, filterQuery]);

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
            <span>Study Favorites ({favoriteCards.length})</span>
          </Link>
        </div>
      </div>

      {/* Add Words to Favorites (Library Search) */}
      <div className="p-5 rounded-2xl border bg-card/60 shadow-xs space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Search Vocabulary to Add to Favorites</span>
          {addQuery && <span className="text-xs font-normal text-muted-foreground">{librarySearchResults.length} matches found</span>}
        </label>
        <div className="flex items-center px-3 py-2 rounded-xl border bg-background space-x-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={addQuery}
            onChange={(e) => setAddQuery(e.target.value)}
            placeholder="Search by Latin (macrons optional) or English to add words..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60"
          />
          {addQuery && (
            <button onClick={() => setAddQuery('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown/Grid */}
        {librarySearchResults.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 pt-2 animate-in fade-in">
            {librarySearchResults.map((card) => {
              const isFav = !!cardProgress[card.id]?.favorite;
              return (
                <div
                  key={card.id}
                  className="p-3 rounded-xl border bg-background flex items-center justify-between hover:border-amber-500/40 transition gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{card.term}</div>
                    <div className="text-xs text-muted-foreground truncate">{card.definition}</div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(card.id)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                      isFav
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
                    <span>{isFav ? 'Favorited' : 'Add'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Existing Favorites Area */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">Your Starred Words ({favoriteCards.length})</h2>
          {favoriteCards.length > 5 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter favorites..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {favoriteCards.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed text-muted-foreground text-sm space-y-2">
            <StarOff className="w-12 h-12 mx-auto opacity-20 mb-2" />
            <p className="font-semibold text-foreground text-base">No favorites yet.</p>
            <p>Use the search box above or click the star on any flashcard to save words here for quick study.</p>
          </div>
        ) : displayFavorites.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No favorites match "{filterQuery}".
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayFavorites.map((card: Card) => (
              <div key={card.id} className="p-4 rounded-xl border bg-card shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-base text-foreground">{card.term}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{card.definition}</div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(card.id)}
                    className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 transition"
                    title="Remove from favorites"
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
  );
}
