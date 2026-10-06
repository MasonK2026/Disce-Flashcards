import { X, RotateCcw } from 'lucide-react';

interface QuizHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  revisitCount: number;
  progressPercent: number;
  sessionTitle: string;
  onExit: () => void;
}

export function QuizHeader({
  currentIndex,
  totalQuestions,
  revisitCount,
  progressPercent,
  sessionTitle,
  onExit,
}: QuizHeaderProps) {
  return (
    <div className="w-full bg-card border-b sticky top-0 z-40 backdrop-blur-md bg-card/90">
      {/* Top progress bar */}
      <div className="w-full h-2 bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onExit}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
            title="Exit Quiz"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              {sessionTitle}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-foreground">
                Question {currentIndex} of {totalQuestions}
              </span>
              {revisitCount > 0 && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  <RotateCcw className="w-3 h-3" />
                  <span>{revisitCount} to revisit</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-extrabold text-primary">
            {Math.round(progressPercent)}%
          </span>
          <span className="text-xs text-muted-foreground block">completed</span>
        </div>
      </div>
    </div>
  );
}
