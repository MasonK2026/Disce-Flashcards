import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { useUserStore } from '../stores/userStore';
import { useDeckStore } from '../stores/deckStore';
import { Flashcard } from '../components/flashcard/Flashcard';
import { ArrowLeft, ArrowRight, Shuffle, Repeat, CheckCircle2 } from 'lucide-react';
import type { Card } from '../types';
import confetti from 'canvas-confetti';

export function StudyPage() {
  const { source } = useParams();
  const navigate = useNavigate();
  const { chapters, allCards, isLoading, searchStudyCardIds } = useDataStore();
  const { settings, cardProgress, setDirection, setLastStudySession } = useUserStore();
  const { decks, customCards } = useDeckStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  // Swipe logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

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

  useEffect(() => {
    if (source && sessionTitle && !isLoading && activeCards.length > 0) {
      setLastStudySession({ source, label: sessionTitle });
    }
  }, [source, sessionTitle, isLoading, activeCards.length, setLastStudySession]);

  // Handle shuffling
  const displayCards = useMemo(() => {
    if (!isShuffled) return activeCards;
    return [...activeCards].sort(() => Math.random() - 0.5);
  }, [activeCards, isShuffled]);

  const isComplete = currentIndex >= displayCards.length && displayCards.length > 0;

  useEffect(() => {
    if (isComplete) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isComplete]);

  const handleNext = useCallback(() => {
    if (isComplete) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 120);
  }, [isComplete]);

  const handlePrev = useCallback(() => {
    if (currentIndex === 0 || isComplete) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
    }, 120);
  }, [currentIndex, isComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        if (!isComplete) setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isComplete]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

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

  if (isComplete) {
    return (
      <div className="max-w-md mx-auto text-center p-12 space-y-6 mt-12">
        <CheckCircle2 className="w-24 h-24 mx-auto text-primary mb-4" />
        <h2 className="text-4xl font-black italic text-primary">Optime!</h2>
        <p className="text-muted-foreground">
          You've completed this study session of <strong>{displayCards.length}</strong> cards.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
          <button 
            onClick={() => {
              setCurrentIndex(0);
              setIsShuffled(true);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition shadow-sm"
          >
            Shuffle & Review Again
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const currentCard = displayCards[currentIndex];
  const progressPercent = Math.round((currentIndex / displayCards.length) * 100);

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
      <div 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
        className="touch-pan-y"
      >
        <Flashcard 
          card={currentCard} 
          isFlipped={isFlipped} 
          direction={settings.defaultDirection}
          onFlip={() => setIsFlipped(!isFlipped)} 
        />
      </div>

      {/* Bottom Controls */}
      <div className="flex justify-center items-center space-x-8 pt-4">
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-full hover:bg-muted/60 border border-border/60 transition shadow-sm disabled:opacity-30 disabled:hover:bg-transparent"
          title="Previous Card (Left Arrow)"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-muted-foreground select-none">
            Space or ↑/↓ to flip
          </span>
          <span className="text-[10px] text-muted-foreground/70 select-none">
            Swipe or ←/→ to navigate
          </span>
        </div>

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
