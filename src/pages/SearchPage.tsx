import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDataStore, CHAPTER_SLUGS } from '../stores/dataStore';
import { useUserStore } from '../stores/userStore';
import { useDeckStore } from '../stores/deckStore';
import { normalizeLatinSearch, generateVocabulaLink, generateLatinIsSimpleLink, generateCactusLink } from '../lib/latinNormalize';
import { GrammarBadge } from '../components/grammar/GrammarBadge';
import { EditGrammarModal } from '../components/grammar/EditGrammarModal';
import { Search, X, Filter, Play, Star, CheckCircle, Check, ExternalLink, Tag, RotateCcw } from 'lucide-react';
import type { Card } from '../types';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { allCards, chapters, isLoading, loadData, setSearchStudyPool } = useDataStore();
  const { cardProgress, toggleFavorite, toggleMemorized } = useUserStore();
  const { decks, addCardToDeck, customCards } = useDeckStore();

  // Ensure data is loaded
  useEffect(() => {
    if (chapters.length === 0 && !isLoading) {
      loadData();
    }
  }, [chapters, isLoading, loadData]);

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  // Filter states
  const [selectedPos, setSelectedPos] = useState('all');
  const [selectedConj, setSelectedConj] = useState('all');
  const [selectedDecl, setSelectedDecl] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedAdjType, setSelectedAdjType] = useState('all');
  const [selectedChapter, setSelectedChapter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [targetDeckId, setTargetDeckId] = useState('');
  const [addedBatchNotice, setAddedBatchNotice] = useState('');

  // Keep URL search params in sync with query
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [query, setSearchParams]);

  // Combined card pool (official + user custom)
  const combinedCards = useMemo(() => {
    return [...allCards, ...customCards];
  }, [allCards, customCards]);

  // Map to get chapter name
  const getChapterName = (cardId: string) => {
    if (cardId.startsWith('custom_')) return 'Custom Word';
    const slug = cardId.split('_')[0];
    const ch = chapters.find(c => c.chapter === slug);
    return ch?.chapter_title || slug.toUpperCase();
  };

  // Filter pipeline
  const filteredCards = useMemo(() => {
    const normQuery = normalizeLatinSearch(query.trim());
    const lowerQuery = query.toLowerCase().trim();

    return combinedCards.filter((card) => {
      // 1. Text Search Query Match (if query provided)
      if (normQuery) {
        const normTerm = normalizeLatinSearch(card.term);
        const lowerDef = card.definition.toLowerCase();
        const matchesTerm = normTerm.includes(normQuery);
        const matchesDef = lowerDef.includes(lowerQuery);
        if (!matchesTerm && !matchesDef) return false;
      }

      // 2. Part of Speech Filter
      if (selectedPos !== 'all' && card.partOfSpeech !== selectedPos) {
        return false;
      }

      // 3. Verb Conjugation Filter
      if (selectedConj !== 'all') {
        if (card.partOfSpeech !== 'verb') return false;
        if (selectedConj === 'irregular' && !card.grammar?.isIrregular) return false;
        if (selectedConj === 'deponent' && !card.grammar?.isDeponent) return false;
        if (selectedConj === '1' && (card.grammar?.conjugation !== 1 || card.grammar?.isDeponent || card.grammar?.isIrregular)) return false;
        if (selectedConj === '2' && (card.grammar?.conjugation !== 2 || card.grammar?.isDeponent || card.grammar?.isIrregular)) return false;
        if (selectedConj === '3' && (card.grammar?.conjugation !== 3 || card.grammar?.isDeponent || card.grammar?.isIrregular || card.grammar?.conjugationLabel?.includes('-io'))) return false;
        if (selectedConj === '3-io' && !card.grammar?.conjugationLabel?.includes('3rd-io')) return false;
        if (selectedConj === '4' && (card.grammar?.conjugation !== 4 || card.grammar?.isDeponent || card.grammar?.isIrregular)) return false;
      }

      // 4. Noun Declension Filter
      if (selectedDecl !== 'all') {
        if (card.partOfSpeech !== 'noun') return false;
        const declNum = Number(selectedDecl);
        if (card.grammar?.declension !== declNum) return false;
      }

      // 5. Gender Filter
      if (selectedGender !== 'all') {
        if (card.partOfSpeech !== 'noun') return false;
        if (!card.grammar?.gender?.includes(selectedGender)) return false;
      }

      // 6. Adjective Type Filter
      if (selectedAdjType !== 'all') {
        if (card.partOfSpeech !== 'adjective') return false;
        if (!card.grammar?.adjectiveType?.includes(selectedAdjType)) return false;
      }

      // 7. Specific Chapter Filter
      const cardChapterSlug = card.id.split('_')[0];
      if (selectedChapter !== 'all' && cardChapterSlug !== selectedChapter) {
        return false;
      }

      // 8. Learning Status Filter
      const progress = cardProgress[card.id];
      if (selectedStatus === 'memorized' && !progress?.memorized) return false;
      if (selectedStatus === 'unmemorized' && progress?.memorized) return false;
      if (selectedStatus === 'favorites' && !progress?.favorite) return false;

      return true;
    });
  }, [
    combinedCards,
    query,
    selectedPos,
    selectedConj,
    selectedDecl,
    selectedGender,
    selectedAdjType,
    selectedChapter,
    selectedStatus,
    cardProgress,
  ]);

  // Handle Study Filtered Results
  const handleStudyFiltered = () => {
    const ids = filteredCards.map(c => c.id);
    setSearchStudyPool(ids);
    navigate('/study/search');
  };

  // Handle Add All to Deck
  const handleAddAllToDeck = () => {
    if (!targetDeckId || filteredCards.length === 0) return;
    filteredCards.forEach(c => addCardToDeck(targetDeckId, c.id));
    const deckObj = decks.find(d => d.id === targetDeckId);
    setAddedBatchNotice(`Added ${filteredCards.length} words to "${deckObj?.name || 'Deck'}"!`);
    setTimeout(() => setAddedBatchNotice(''), 3000);
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedPos('all');
    setSelectedConj('all');
    setSelectedDecl('all');
    setSelectedGender('all');
    setSelectedAdjType('all');
    setSelectedChapter('all');
    setSelectedStatus('all');
  };

  const activeFiltersCount = [
    query.trim() !== '',
    selectedPos !== 'all',
    selectedConj !== 'all',
    selectedDecl !== 'all',
    selectedGender !== 'all',
    selectedAdjType !== 'all',
    selectedChapter !== 'all',
    selectedStatus !== 'all',
  ].filter(Boolean).length;

  if (isLoading && combinedCards.length === 0) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm font-medium">Loading vocabulary dictionary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Vocabulary Search & Filters</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse all {combinedCards.length} words in the library or filter by grammatical attributes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {filteredCards.length > 0 && (
            <button
              onClick={handleStudyFiltered}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition text-sm shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Study Results ({filteredCards.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Search Input */}
      <div className="relative">
        <div className="flex items-center px-4 py-3 rounded-2xl border bg-card shadow-sm space-x-3 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type Latin (e.g. ambulat, videre) or English (e.g. walk, see), or leave empty to browse all..."
            className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/60 text-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              title="Clear search text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar & Controls */}
      <div className="p-5 rounded-2xl border bg-card/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground transition font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {/* Part of Speech */}
          <div className="space-y-1">
            <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              Part of Speech
            </label>
            <select
              value={selectedPos}
              onChange={(e) => {
                const nextPos = e.target.value;
                setSelectedPos(nextPos);
                if (nextPos !== 'verb') setSelectedConj('all');
                if (nextPos !== 'noun') { setSelectedDecl('all'); setSelectedGender('all'); }
                if (nextPos !== 'adjective') setSelectedAdjType('all');
              }}
              className="w-full p-2 rounded-lg border bg-background font-medium focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="verb">Verb</option>
              <option value="noun">Noun</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
              <option value="preposition">Preposition</option>
              <option value="conjunction">Conjunction</option>
              <option value="pronoun">Pronoun</option>
              <option value="other">Other / Phrase</option>
            </select>
          </div>

          {/* Verb Conjugation (Only shown when POS is Verb or All) */}
          {(selectedPos === 'all' || selectedPos === 'verb') && (
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                Conjugation
              </label>
              <select
                value={selectedConj}
                onChange={(e) => {
                  setSelectedConj(e.target.value);
                  if (e.target.value !== 'all' && selectedPos === 'all') {
                    setSelectedPos('verb');
                  }
                }}
                className="w-full p-2 rounded-lg border bg-background font-medium focus:outline-none"
              >
                <option value="all">All Conjugations</option>
                <option value="1">1st (-āre)</option>
                <option value="2">2nd (-ēre)</option>
                <option value="3">3rd (-ere)</option>
                <option value="3-io">3rd-io (-ere / -iō)</option>
                <option value="4">4th (-īre)</option>
                <option value="deponent">Deponent Verbs</option>
                <option value="irregular">Irregular Verbs</option>
              </select>
            </div>
          )}

          {/* Noun Declension (Only shown when POS is Noun or All) */}
          {(selectedPos === 'all' || selectedPos === 'noun') && (
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                Declension
              </label>
              <select
                value={selectedDecl}
                onChange={(e) => {
                  setSelectedDecl(e.target.value);
                  if (e.target.value !== 'all' && selectedPos === 'all') {
                    setSelectedPos('noun');
                  }
                }}
                className="w-full p-2 rounded-lg border bg-background font-medium focus:outline-none"
              >
                <option value="all">All Declensions</option>
                <option value="1">1st Declension</option>
                <option value="2">2nd Declension</option>
                <option value="3">3rd Declension</option>
                <option value="4">4th Declension</option>
                <option value="5">5th Declension</option>
              </select>
            </div>
          )}

          {/* Gender (Only shown when POS is Noun or All) */}
          {(selectedPos === 'all' || selectedPos === 'noun') && (
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                Gender
              </label>
              <select
                value={selectedGender}
                onChange={(e) => {
                  setSelectedGender(e.target.value);
                  if (e.target.value !== 'all' && selectedPos === 'all') {
                    setSelectedPos('noun');
                  }
                }}
                className="w-full p-2 rounded-lg border bg-background font-medium focus:outline-none"
              >
                <option value="all">All Genders</option>
                <option value="m">Masculine (m.)</option>
                <option value="f">Feminine (f.)</option>
                <option value="n">Neuter (n.)</option>
              </select>
            </div>
          )}

          {/* Adjective Type (Only shown when POS is Adjective or All) */}
          {(selectedPos === 'all' || selectedPos === 'adjective') && (
            <div className="space-y-1">
              <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                Adjective Type
              </label>
              <select
                value={selectedAdjType}
                onChange={(e) => {
                  setSelectedAdjType(e.target.value);
                  if (e.target.value !== 'all' && selectedPos === 'all') {
                    setSelectedPos('adjective');
                  }
                }}
                className="w-full p-2 rounded-lg border bg-background font-medium focus:outline-none"
              >
                <option value="all">All Adjective Types</option>
                <option value="1st/2nd Decl.">1st/2nd Declension</option>
                <option value="3rd Decl.">3rd Declension</option>
                <option value="Indeclinable">Indeclinable</option>
              </select>
            </div>
          )}

          {/* Specific Chapter */}
          <div className="space-y-1">
            <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              Chapter
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full p-2 rounded-lg border bg-background font-medium focus:outline-none"
            >
              <option value="all">All Chapters (53)</option>
              {chapters.length > 0 ? (
                chapters.map(ch => (
                  <option key={ch.chapter} value={ch.chapter}>
                    {ch.chapter_title}
                  </option>
                ))
              ) : (
                CHAPTER_SLUGS.map(slug => (
                  <option key={slug} value={slug}>{slug.toUpperCase()}</option>
                ))
              )}
            </select>
          </div>

          {/* Learning Status */}
          <div className="space-y-1">
            <label className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 rounded-lg border bg-background font-medium focus:outline-none"
            >
              <option value="all">All Words</option>
              <option value="memorized">Memorized Only</option>
              <option value="unmemorized">Unmemorized Only</option>
              <option value="favorites">Starred Favorites Only</option>
            </select>
          </div>
        </div>

        {/* Batch Add to Deck action */}
        {decks.length > 0 && filteredCards.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground font-medium">Add {filteredCards.length} results to deck:</span>
              <select
                value={targetDeckId}
                onChange={(e) => setTargetDeckId(e.target.value)}
                className="px-2.5 py-1 rounded-lg border bg-background text-xs"
              >
                <option value="">Select a Custom Deck...</option>
                {decks.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button
                disabled={!targetDeckId}
                onClick={handleAddAllToDeck}
                className="px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add All
              </button>
            </div>

            {addedBatchNotice && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in">
                {addedBatchNotice}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <div>
          <span>Showing <strong className="text-foreground">{filteredCards.length}</strong> of {combinedCards.length} words</span>
          {activeFiltersCount > 0 && (
            <span className="ml-2 text-xs text-primary font-medium">
              (Filtered)
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-primary hover:underline font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results Grid */}
      {filteredCards.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-dashed text-muted-foreground text-sm space-y-3">
          <p className="font-semibold text-foreground text-base">No words matched your search criteria.</p>
          <p className="text-xs max-w-md mx-auto">
            {query.trim() ? (
              <span>Your search for <strong className="text-foreground">"{query}"</strong> did not yield any matches with the selected filters.</span>
            ) : (
              <span>No words in the library match all of your selected filters simultaneously.</span>
            )}
          </p>
          <div className="flex justify-center gap-2 pt-1">
            {query.trim() && (
              <button
                onClick={() => setQuery('')}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-muted"
              >
                Clear Search Text
              </button>
            )}
            <button
              onClick={handleResetFilters}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => {
            const progress = cardProgress[card.id] || { favorite: false, memorized: false };
            const chName = getChapterName(card.id);

            return (
              <div
                key={card.id}
                className="p-4 rounded-xl border bg-card shadow-sm hover:border-primary/40 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-base text-foreground leading-snug">{card.term}</div>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.2 rounded bg-muted text-muted-foreground">
                        {chName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => setEditingCard(card)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground/60 hover:text-primary transition"
                        title="Edit classification (Honor system)"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(card.id)}
                        className={`p-1 rounded-md hover:bg-muted transition ${progress.favorite ? 'text-yellow-500' : 'text-muted-foreground/60'}`}
                        title={progress.favorite ? 'Favorited' : 'Favorite word'}
                      >
                        <Star className="w-4 h-4" fill={progress.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => toggleMemorized(card.id)}
                        className="p-1 rounded-md hover:bg-muted transition"
                        title={progress.memorized ? 'Memorized' : 'Mark as memorized'}
                      >
                        {progress.memorized ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-muted-foreground/60" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mt-2">{card.definition}</div>
                </div>

                <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                  <GrammarBadge grammar={card.grammar} partOfSpeech={card.partOfSpeech} />

                  <div className="flex items-center space-x-2 text-xs">
                    <a
                      href={generateVocabulaLink(card.term)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline flex items-center"
                      title="Vocabula.lat"
                    >
                      Vocabula <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                    <a
                      href={generateLatinIsSimpleLink(card.term)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-500 hover:underline flex items-center"
                      title="Latin is Simple"
                    >
                      Latin is Simple <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                    {card.partOfSpeech === 'verb' && (
                      <a
                        href={generateCactusLink(card.term)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-500 hover:underline flex items-center"
                        title="Cactus 2000"
                      >
                        Cactus 2000 <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Classification Modal */}
      <EditGrammarModal
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        card={editingCard}
      />
    </div>
  );
}
