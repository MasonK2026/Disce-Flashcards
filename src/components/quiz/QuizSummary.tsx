import { useEffect } from 'react';
import { Trophy, RotateCcw, Home, PlusCircle, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Card } from '../../types';
import { useDeckStore } from '../../stores/deckStore';
import { useUserStore } from '../../stores/userStore';

interface QuizSummaryProps {
  totalInitialQuestions: number;
  firstTryCorrectCount: number;
  missedCards: Card[];
  sessionTitle: string;
  onRestart: () => void;
  onExit: () => void;
}

export function QuizSummary({
  totalInitialQuestions,
  firstTryCorrectCount,
  missedCards,
  sessionTitle,
  onRestart,
  onExit,
}: QuizSummaryProps) {
  const { toggleFavorite, cardProgress } = useUserStore();
  const { createDeck, addCardsToDeck } = useDeckStore();

  const firstTryPercent = totalInitialQuestions > 0
    ? Math.round((firstTryCorrectCount / totalInitialQuestions) * 100)
    : 100;

  useEffect(() => {
    // Celebration confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const handleCreateDeckFromMissed = () => {
    if (missedCards.length === 0) return;
    const newDeck = createDeck(`Quiz Review: ${sessionTitle} (${new Date().toLocaleDateString()})`);
    addCardsToDeck(newDeck.id, missedCards.map(c => c.id));
    alert(`Created custom deck "${newDeck.name}" with ${missedCards.length} words!`);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 text-center animate-in fade-in duration-300">
      <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
        {/* Trophy Header */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            Quiz Completed!
          </h2>
          <p className="text-sm text-muted-foreground">
            {sessionTitle} • 100% Mastered through repetition
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-xl border bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              First-Try Accuracy
            </span>
            <span className="text-3xl font-black text-primary mt-1 block">
              {firstTryPercent}%
            </span>
            <span className="text-xs text-muted-foreground">
              {firstTryCorrectCount} of {totalInitialQuestions} correct
            </span>
          </div>

          <div className="p-4 rounded-xl border bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Repeated & Mastered
            </span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {missedCards.length}
            </span>
            <span className="text-xs text-muted-foreground">
              missed & drilled at end
            </span>
          </div>
        </div>

        {/* Missed Cards List (if any) */}
        {missedCards.length > 0 && (
          <div className="text-left space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Words to Keep Practicing ({missedCards.length})
              </span>
              <button
                onClick={handleCreateDeckFromMissed}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Save to Deck</span>
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {missedCards.map((card) => {
                const isFav = cardProgress[card.id]?.favorite;
                return (
                  <div
                    key={card.id}
                    className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{card.term}</span>
                      <span className="text-xs text-muted-foreground">{card.definition}</span>
                    </div>
                    <button
                      onClick={() => toggleFavorite(card.id)}
                      className={`p-1.5 rounded-lg hover:bg-muted transition ${isFav ? 'text-amber-500' : 'text-muted-foreground'}`}
                      title="Star word"
                    >
                      <Star className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center justify-center space-x-2 transition shadow-xs text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Quiz Again</span>
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 px-4 rounded-xl border hover:bg-muted font-bold text-foreground flex items-center justify-center space-x-2 transition text-sm"
          >
            <Home className="w-4 h-4" />
            <span>Exit to Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
}
