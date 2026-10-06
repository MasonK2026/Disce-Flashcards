import { useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Check } from 'lucide-react';
import type { QuizQuestion } from '../../lib/quizGenerator';

interface QuizFeedbackProps {
  question: QuizQuestion;
  isCorrect: boolean;
  userAnswer: string;
  onContinue: () => void;
  onOverrideCorrect: () => void;
}

export function QuizFeedback({
  question,
  isCorrect,
  userAnswer,
  onContinue,
  onOverrideCorrect,
}: QuizFeedbackProps) {
  // Listen for Enter or Space to quickly advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue]);

  return (
    <div
      className={`w-full max-w-xl mx-auto rounded-2xl p-5 border transition animate-in fade-in duration-200 shadow-md ${
        isCorrect
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
          : 'bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          {isCorrect ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <h4 className="font-extrabold text-base leading-tight">
              {isCorrect ? 'Correct!' : 'Incorrect — Keep going!'}
            </h4>

            {!isCorrect && (
              <div className="text-sm space-y-1 pt-1">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block">Correct answer:</span>
                  <span className="font-bold text-foreground text-base">{question.correctAnswer}</span>
                </div>
                {userAnswer && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block">Your answer:</span>
                    <span className="text-muted-foreground line-through">{userAnswer}</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground pt-1 italic">
              {question.explanation}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 shrink-0">
          {!isCorrect && (
            <button
              onClick={onOverrideCorrect}
              className="text-xs text-muted-foreground hover:text-foreground underline px-2 py-1 flex items-center gap-1 transition"
              title="Override and mark as correct"
            >
              <Check className="w-3 h-3" />
              <span>I was right</span>
            </button>
          )}

          <button
            onClick={onContinue}
            className={`px-4 py-2 rounded-xl text-white font-bold text-sm flex items-center space-x-1.5 transition shadow-sm ${
              isCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
