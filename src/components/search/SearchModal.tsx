import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../stores/dataStore';
import { useUserStore } from '../../stores/userStore';
import { useDeckStore } from '../../stores/deckStore';
import { normalizeLatinSearch, generateVocabulaLink, generateLatinIsSimpleLink, generateCactusLink } from '../../lib/latinNormalize';
import { searchWhitakers } from '../../lib/whitakers';
import { GrammarBadge } from '../grammar/GrammarBadge';
import { EditGrammarModal } from '../grammar/EditGrammarModal';
import { Search, X, ExternalLink, Star, Tag, ArrowRight, Library, Save } from 'lucide-react';
import type { Card } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const { allCards, chapters } = useDataStore();
  const { cardProgress, toggleFavorite } = useUserStore();
  const { createCustomCard } = useDeckStore();
  
  const [query, setQuery] = useState('');
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  
  const [whitakerResults, setWhitakerResults] = useState<Card[]>([]);
  const [isSearchingWhitakers, setIsSearchingWhitakers] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenFullSearch = () => {
    onClose();
    navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setWhitakerResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setWhitakerResults([]);
      return;
    }
    
    const timeout = setTimeout(async () => {
      setIsSearchingWhitakers(true);
      try {
        const res = await searchWhitakers(query.trim());
        if (active) setWhitakerResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setIsSearchingWhitakers(false);
      }
    }, 300);
    
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  // Map to get chapter title from card id
  const getChapterName = (cardId: string) => {
    const slug = cardId.split('_')[0];
    const ch = chapters.find(c => c.chapter === slug);
    return ch?.chapter_title || slug.toUpperCase();
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const normQuery = normalizeLatinSearch(query.trim());
    const lowerQuery = query.toLowerCase().trim();

    const matches: { card: Card; score: number }[] = [];

    for (const card of allCards) {
      const normTerm = normalizeLatinSearch(card.term);
      const lowerDef = card.definition.toLowerCase();

      let score = 0;

      // Exact term match
      if (normTerm === normQuery) {
        score = 100;
      } else if (normTerm.startsWith(normQuery)) {
        score = 80;
      } else if (normTerm.includes(normQuery)) {
        score = 60;
      } else if (lowerDef.includes(lowerQuery)) {
        score = 40;
      }

      if (score > 0) {
        matches.push({ card, score });
      }
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, 30).map(m => m.card);
  }, [query, allCards]);

  const filteredWhitaker = useMemo(() => {
    return whitakerResults.filter(w => {
      const wNorm = normalizeLatinSearch(w.term);
      return !results.some(r => normalizeLatinSearch(r.term) === wNorm);
    });
  }, [whitakerResults, results]);

  const handleSaveWhitaker = (card: Card) => {
    const { id, ...cardData } = card;
    createCustomCard(cardData);
    setWhitakerResults(prev => prev.filter(c => c.id !== card.id));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 md:pt-24 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b space-x-3 bg-card">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleOpenFullSearch();
              }
            }}
            placeholder="Search Latin or English (e.g. videre, ambulat, walk)..."
            className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/60 text-foreground"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border/80 text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-border/40">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-muted-foreground text-sm space-y-1">
              <p className="font-medium text-foreground">Quick Latin Dictionary Lookup</p>
              <p>Type any word in Latin (no macrons needed, u/v & i/j interchangeable) or English.</p>
            </div>
          ) : results.length === 0 && filteredWhitaker.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm space-y-4">
              <p>
                No vocabulary cards found for <span className="font-semibold text-foreground">"{query}"</span>.
              </p>
              {isSearchingWhitakers ? (
                <div className="animate-pulse text-muted-foreground flex justify-center items-center space-x-2">
                  <Library className="w-4 h-4" />
                  <span>Checking Whitaker's WORDS...</span>
                </div>
              ) : (
                <div className="flex justify-center">
                  <a
                    href={generateVocabulaLink(query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-semibold text-xs transition shadow-xs"
                  >
                    <span>Search for "{query.trim()}" on Vocabula</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              {results.map((card) => {
                const isFav = cardProgress[card.id]?.favorite;
                const chName = getChapterName(card.id);

                return (
                  <div key={card.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl hover:bg-muted/40 transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-base text-foreground">{card.term}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                          {chName}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{card.definition}</p>
                      <div className="pt-1">
                        <GrammarBadge grammar={card.grammar} partOfSpeech={card.partOfSpeech} />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => setEditingCard(card)}
                        className="p-1.5 rounded-full hover:bg-muted text-muted-foreground/60 hover:text-primary transition"
                        title="Edit classification (Honor system)"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(card.id)}
                        className={`p-1.5 rounded-full hover:bg-muted transition ${isFav ? 'text-yellow-500' : 'text-muted-foreground'}`}
                        title={isFav ? "Favorited" : "Add to favorites"}
                      >
                        <Star className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
                      </button>

                      <div className="flex items-center space-x-1 pl-2 border-l border-border/60">
                        <a
                          href={generateVocabulaLink(card.term)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center transition"
                          title="Search Vocabula.lat"
                        >
                          Vocabula <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                        <a
                          href={generateLatinIsSimpleLink(card.term)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center transition"
                          title="Search Latin is Simple"
                        >
                          Latin is Simple <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                        {card.partOfSpeech === 'verb' && (
                          <a
                            href={generateCactusLink(card.term)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 flex items-center transition"
                            title="Cactus 2000 Conjugation Table"
                          >
                            Cactus 2000 <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredWhitaker.map((card) => (
                <div key={card.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-base text-foreground">{card.term}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wider flex items-center space-x-1">
                        <Library className="w-3 h-3" />
                        <span>Whitaker's WORDS</span>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{card.definition}</p>
                    <div className="pt-1 opacity-90">
                      <GrammarBadge grammar={card.grammar} partOfSpeech={card.partOfSpeech} />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleSaveWhitaker(card)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Word</span>
                    </button>
                    <div className="flex items-center space-x-1 pl-2 border-l border-purple-500/30">
                      <a
                        href={generateVocabulaLink(card.term)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center transition"
                        title="Search Vocabula.lat"
                      >
                        Vocabula <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer info & transition to full search */}
        <div className="px-4 py-2.5 border-t bg-muted/30 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {(results.length > 0 || filteredWhitaker.length > 0) && (
              <span>Showing {results.length + filteredWhitaker.length} matches</span>
            )}
            <span className="hidden sm:inline">· Press ESC to close</span>
          </div>

          <button
            onClick={handleOpenFullSearch}
            className="flex items-center space-x-1.5 font-bold text-primary hover:underline hover:text-primary/80 transition"
          >
            <span>Open in Full Search with Filters</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <EditGrammarModal
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        card={editingCard}
      />
    </div>
  );
}
