import { useState } from 'react';
import { X, Play, CheckSquare, Square } from 'lucide-react';
import type { QuizConfig, DrillType } from '../../lib/quizGenerator';

interface QuizConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (config: QuizConfig) => void;
  title: string;
  totalCards: number;
}

export function QuizConfigModal({
  isOpen,
  onClose,
  onStartQuiz,
  title,
  totalCards,
}: QuizConfigModalProps) {
  const [drillTypes, setDrillTypes] = useState<DrillType[]>([
    'definitions',
    'conjugations',
    'declensions',
  ]);
  const [format, setFormat] = useState<'multiple_choice' | 'write_in' | 'mixed'>('multiple_choice');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [direction, setDirection] = useState<'latin_to_english' | 'english_to_latin'>('latin_to_english');

  if (!isOpen) return null;

  const toggleDrillType = (type: DrillType) => {
    setDrillTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleStart = () => {
    onStartQuiz({
      drillTypes,
      format,
      questionCount: questionCount > 0 ? questionCount : undefined,
      direction,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b">
          <div>
            <h3 className="text-xl font-bold text-foreground">Configure Quiz</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{title} • {totalCards} words pool</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drill Focus */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Drill Topics
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { id: 'definitions', label: 'Definitions' },
              { id: 'conjugations', label: 'Conjugations (1st form)' },
              { id: 'declensions', label: 'Declensions (Nouns)' },
              { id: 'principal_parts', label: 'Principal Parts' },
            ].map(item => {
              const isChecked = drillTypes.includes(item.id as DrillType);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleDrillType(item.id as DrillType)}
                  className={`p-3 rounded-xl border text-left flex items-center space-x-2 transition ${
                    isChecked
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  {isChecked ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Format */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Question Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'multiple_choice', label: 'Multiple Choice' },
              { id: 'write_in', label: 'Write-In (Typing)' },
              { id: 'mixed', label: 'Mixed (50/50)' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFormat(item.id as any)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                  format === item.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 hover:bg-muted text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Translation Direction */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Translation Direction
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'latin_to_english', label: 'Latin → English' },
              { id: 'english_to_latin', label: 'English → Latin' },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDirection(item.id as any)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                  direction === item.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 hover:bg-muted text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Question Count
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { count: 10, label: '10 Questions' },
              { count: 20, label: '20 Questions' },
              { count: 50, label: '50 Questions' },
              { count: 0, label: 'All Words' },
            ].map(item => (
              <button
                key={item.count}
                type="button"
                onClick={() => setQuestionCount(item.count)}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition text-center ${
                  questionCount === item.count
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 hover:bg-muted text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center justify-center space-x-2 transition shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
}
