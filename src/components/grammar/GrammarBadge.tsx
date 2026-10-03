import type { GrammarInfo } from '../../types';

interface GrammarBadgeProps {
  grammar?: GrammarInfo;
  partOfSpeech?: string;
  className?: string;
}

export function GrammarBadge({ grammar, partOfSpeech, className = '' }: GrammarBadgeProps) {
  if (!grammar && !partOfSpeech) return null;

  return (
    <div className={`inline-flex flex-wrap gap-1.5 items-center ${className}`}>
      {/* Part of Speech */}
      {partOfSpeech && (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border/50">
          {partOfSpeech}
        </span>
      )}

      {/* Irregular Flag */}
      {grammar?.isIrregular && (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
          Irregular
        </span>
      )}

      {/* Deponent Flag */}
      {grammar?.isDeponent && !grammar.isIrregular && (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          Deponent
        </span>
      )}

      {/* Conjugation Label */}
      {grammar?.conjugationLabel && !grammar.isIrregular && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {grammar.conjugationLabel}
        </span>
      )}

      {/* Declension Label */}
      {grammar?.declensionLabel && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {grammar.declensionLabel}
        </span>
      )}

      {/* Gender Label */}
      {grammar?.genderLabel && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          {grammar.genderLabel}
        </span>
      )}

      {/* Adjective Type */}
      {grammar?.adjectiveType && (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          {grammar.adjectiveType}
        </span>
      )}
    </div>
  );
}
