import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { useUserStore } from '../stores/userStore';
import { useDeckStore } from '../stores/deckStore';
import { Flashcard } from '../components/flashcard/Flashcard';
import { ArrowLeft, ArrowRight, Shuffle, Repeat } from 'lucide-react';
import type { Card } from '../types';

export function StudyPage() {
  const { source } = useParams();
  const { chapters, allCards, isLoading, searchStudyCardIds } = useDataStore();
  const { settings, cardProgress, setDirection } = useUserStore();
  const { decks, customCards } = useDeckStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // Derive the active pool of cards based on study source
  const { activeCards, sessionTitle, backPath } = useMemo(() => {
    if (isLoading || chapters.length === 0) {
      return { activeCards: [], sessionTitle: 'Loading...', backPath: '/' };
    }

    if (source === 'active') {
      const activeSlugs = settings.activeChapters;
      const pool = allCards.filter(card => {
        const slug = card.id.split('_')[0];
        return activeSlugs.includes(slug);
      });
      return {
        activeCards: pool,
        sessionTitle: `Active Selection (${activeSlugs.length} chapters)`,
        backPath: '/',
      };
    }

    if (source === 'favorites') {
      const pool = allCards.filter(card => cardProgress[card.id]?.favorite);
      return {
        activeCards: pool,
        sessionTitle: 'Starred Favorites',
        backPath: '/',
      };
    }

    if (source === 'search') {
      const combined = [...allCards, ...customCards];
      const pool = searchStudyCardIds
        .map(id => combined.find(c => c.id === id))
        .filter((c): c is Card => c !== undefined);
      return {
        activeCards: pool,
        sessionTitle: `Filtered Search Results (${pool.length} words)`,
        backPath: '/search',
      };
    }

    if (source?.startsWith('deck_')) {
      const deck = decks.find(d => d.id === source);
      const combined = [...allCards, ...customCards];
      const pool = deck
        ? deck.cardIds.map(id => combined.find(c => c.id === id)).filter((c): c is Card => c !== undefined)
        : [];
      return {
        activeCards: pool,
        sessionTitle: deck?.name || 'Custom Deck',
        backPath: `/decks/${source}`,
      };
    }

    if (source?.startsWith('ch')) {
      const chapter = chapters.find(c => c.chapter === source);
      let pool: Card[] = [];
      if (chapter) {
        Object.values(chapter.categories).forEach(cat => {
          pool = pool.concat(cat.cards);
        });
      }
      return {
        activeCards: pool,
        sessionTitle: chapter?.chapter_title || source,
        backPath: `/chapters/${source}`,
      };
    }

    return { activeCards: [], sessionTitle: 'Study Session', backPath: '/' };
  }, [chapters, allCards, isLoading, source, settings.activeChapters, cardProgress, decks, customCards, searchStudyCardIds]);

  // Handle shuffling
  const displayCards = useMemo(() => {
    if (!isShuffled) return activeCards;
    return [...activeCards].sort(() => Math.random() - 0.5);
  }, [activeCards, isShuffled]);

  const currentCard = displayCards[currentIndex];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % displayCards.length);
    }, 120);
  }, [displayCards.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + displayCards.length) % displayCards.length);
    }, 120);
  }, [displayCards.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  if (isLoading) return <div className="text-center p-12 text-muted-foreground">Loading study cards...</div>;
  if (displayCards.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center p-12 space-y-4">
        <h2 className="text-xl font-bold">No cards in this deck</h2>
        <p className="text-sm text-muted-foreground">
          {source === 'favorites' 
            ? 'You have not favorited any vocabulary cards yet. Click the star on any card to add it here.'
            : 'No cards match your current selection. Adjust your active chapters in the top bar.'}
        </p>
        <Link to={backPath} className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          Go Back
        </Link>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / displayCards.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header / Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center space-x-3">
          <Link to={backPath} className="text-muted-foreground hover:text-foreground flex items-center text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <span className="font-semibold text-base">{sessionTitle}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setDirection(settings.defaultDirection === 'LA-EN' ? 'EN-LA' : 'LA-EN')}
            className="flex items-center text-xs font-semibold px-2.5 py-1.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition"
            title="Toggle Flashcard Direction"
          >
            <Repeat className="w-3.5 h-3.5 mr-1.5" />
            {settings.defaultDirection === 'LA-EN' ? 'Latin → English' : 'English → Latin'}
          </button>
          
          <button 
            onClick={() => {
              setIsShuffled(prev => !prev);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`p-1.5 rounded-lg border transition ${
              isShuffled 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-card text-muted-foreground hover:text-foreground border-border/80'
            }`}
            title="Shuffle Deck"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Counter */}
      <div className="text-center text-xs font-mono text-muted-foreground">
        Card {currentIndex + 1} of {displayCards.length}
      </div>

      {/* Flashcard Area */}
      <Flashcard 
        card={currentCard} 
        isFlipped={isFlipped} 
        direction={settings.defaultDirection}
        onFlip={() => setIsFlipped(!isFlipped)} 
      />

      {/* Bottom Controls */}
      <div className="flex justify-center items-center space-x-8 pt-4">
        <button 
          onClick={handlePrev}
          className="p-3 rounded-full hover:bg-muted/60 border border-border/60 transition shadow-sm"
          title="Previous Card (Left Arrow)"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs text-muted-foreground select-none">
          Space to flip · ← / → to navigate
        </span>

        <button 
          onClick={handleNext}
          className="p-3 rounded-full hover:bg-muted/60 border border-border/60 transition shadow-sm"
          title="Next Card (Right Arrow)"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
