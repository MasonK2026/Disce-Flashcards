import { QuizMultipleChoice } from './QuizMultipleChoice';
import { QuizWriteIn } from './QuizWriteIn';
import { QuizFeedback } from './QuizFeedback';
import type { QuizQuestion } from '../../lib/quizGenerator';
import { Tag } from 'lucide-react';

interface QuizCardProps {
  question: QuizQuestion;
  isAnswered: boolean;
  isCorrect: boolean;
  selectedOption: string | null;
  userAnswer: string;
  onSelectOption: (option: string) => void;
  onSubmitWriteIn: (answer: string) => void;
  onContinue: () => void;
  onOverrideCorrect: () => void;
}

export function QuizCard({
  question,
  isAnswered,
  isCorrect,
  selectedOption,
  userAnswer,
  onSelectOption,
  onSubmitWriteIn,
  onContinue,
  onOverrideCorrect,
}: QuizCardProps) {
  const getBadgeStyle = (drillType: string) => {
    switch (drillType) {
      case 'conjugations':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      case 'declensions':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'principal_parts':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Question Card Box */}
      <div className="rounded-2xl border bg-card p-6 md:p-8 shadow-sm space-y-6 text-center">
        {/* Drill Badge & Subtext */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getBadgeStyle(question.drillType)}`}>
            <Tag className="w-3.5 h-3.5" />
            <span>{question.questionLabel}</span>
          </span>

          <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
            {question.format === 'multiple_choice' ? 'Multiple Choice' : 'Write-In'}
          </span>
        </div>

        {/* Primary Prompt */}
        <div className="space-y-2 py-2">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground break-words select-text">
            {question.prompt}
          </h2>
          {question.promptSubtext && (
            <p className="text-sm md:text-base font-medium text-muted-foreground">
              {question.promptSubtext}
            </p>
          )}
        </div>

        {/* Input / Choice Section */}
        <div className="pt-2">
          {question.format === 'multiple_choice' && question.options ? (
            <QuizMultipleChoice
              options={question.options}
              selectedOption={selectedOption}
              correctAnswer={question.correctAnswer}
              isAnswered={isAnswered}
              onSelectOption={onSelectOption}
            />
          ) : (
            <QuizWriteIn
              isAnswered={isAnswered}
              onSubmit={onSubmitWriteIn}
            />
          )}
        </div>
      </div>

      {/* Feedback Banner (Revealed when answered) */}
      {isAnswered && (
        <QuizFeedback
          question={question}
          isCorrect={isCorrect}
          userAnswer={userAnswer}
          onContinue={onContinue}
          onOverrideCorrect={onOverrideCorrect}
        />
      )}
    </div>
  );
}
