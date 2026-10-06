import { useEffect } from 'react';

interface QuizMultipleChoiceProps {
  options: string[];
  selectedOption: string | null;
  correctAnswer: string;
  isAnswered: boolean;
  onSelectOption: (option: string) => void;
}

export function QuizMultipleChoice({
  options,
  selectedOption,
  correctAnswer,
  isAnswered,
  onSelectOption,
}: QuizMultipleChoiceProps) {
  // Keyboard shortcut listener (1-4 or A-D)
  useEffect(() => {
    if (isAnswered) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      let index = -1;

      if (['1', '2', '3', '4'].includes(key)) {
        index = parseInt(key, 10) - 1;
      } else if (['A', 'B', 'C', 'D'].includes(key)) {
        index = key.charCodeAt(0) - 65;
      }

      if (index >= 0 && index < options.length) {
        onSelectOption(options[index]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, isAnswered, onSelectOption]);

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mx-auto">
      {options.map((option, idx) => {
        const isSelected = selectedOption === option;
        const isCorrect = option === correctAnswer;

        let btnStyle = 'border-border/70 hover:border-primary/50 hover:bg-muted/40 text-foreground bg-card';
        if (isAnswered) {
          if (isCorrect) {
            btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-bold';
          } else if (isSelected && !isCorrect) {
            btnStyle = 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-200 line-through';
          } else {
            btnStyle = 'opacity-50 border-border/40 bg-card text-muted-foreground';
          }
        }

        return (
          <button
            key={idx}
            disabled={isAnswered}
            onClick={() => onSelectOption(option)}
            className={`p-4 rounded-xl border text-left transition flex items-center space-x-3 shadow-xs ${btnStyle} disabled:cursor-default`}
          >
            <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center font-bold text-xs shrink-0 text-muted-foreground border border-border/60">
              {optionLetters[idx] || idx + 1}
            </span>
            <span className="text-base font-medium flex-1 break-words">
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}
