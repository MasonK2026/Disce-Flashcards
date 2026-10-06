import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { useUserStore } from '../stores/userStore';
import { useDeckStore } from '../stores/deckStore';
import { QuizHeader } from '../components/quiz/QuizHeader';
import { QuizCard } from '../components/quiz/QuizCard';
import { QuizSummary } from '../components/quiz/QuizSummary';
import { QuizConfigModal } from '../components/quiz/QuizConfigModal';
import {
  generateQuizQuestions,
  evaluateDefinitionAnswer,
  evaluateConjugationAnswer,
  evaluateDeclensionAnswer,
  evaluatePrincipalPartsAnswer,
  type QuizQuestion,
  type QuizConfig,
} from '../lib/quizGenerator';
import type { Card } from '../types';

export function QuizPage() {
  const { source } = useParams();
  const navigate = useNavigate();

  const { chapters, allCards, isLoading, loadData, searchStudyCardIds } = useDataStore();
  const { settings, cardProgress } = useUserStore();
  const { decks, customCards } = useDeckStore();

  // Ensure data loaded
  useEffect(() => {
    if (chapters.length === 0 && !isLoading) {
      loadData();
    }
  }, [chapters, isLoading, loadData]);

  // Derive active card pool and title
  const { cardPool, sessionTitle, backPath } = useMemo(() => {
    if (isLoading || chapters.length === 0) {
      return { cardPool: [], sessionTitle: 'Loading...', backPath: '/' };
    }

    if (source === 'active') {
      const activeSlugs = settings.activeChapters;
      const pool = allCards.filter(card => {
        const slug = card.id.split('_')[0];
        return activeSlugs.includes(slug);
      });
      return {
        cardPool: pool.length > 0 ? pool : allCards,
        sessionTitle: 'Active Vocabulary Quiz',
        backPath: '/',
      };
    }

    if (source === 'favorites') {
      const combined = [...allCards, ...customCards];
      const pool = combined.filter(card => cardProgress[card.id]?.favorite);
      return {
        cardPool: pool,
        sessionTitle: 'Starred Favorites Quiz',
        backPath: '/favorites',
      };
    }

    if (source === 'search') {
      const combined = [...allCards, ...customCards];
      const pool = searchStudyCardIds
        .map(id => combined.find(c => c.id === id))
        .filter((c): c is Card => c !== undefined);
      return {
        cardPool: pool,
        sessionTitle: 'Search Results Quiz',
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
        cardPool: pool,
        sessionTitle: `${deck?.name || 'Custom Deck'} Quiz`,
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
        cardPool: pool,
        sessionTitle: `${chapter?.chapter_title || source} Quiz`,
        backPath: `/chapters/${source}`,
      };
    }

    return {
      cardPool: allCards,
      sessionTitle: 'Vocabulary Quiz',
      backPath: '/',
    };
  }, [source, isLoading, chapters, allCards, customCards, settings.activeChapters, cardProgress, searchStudyCardIds, decks]);

  // Quiz state
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [quizQueue, setQuizQueue] = useState<QuizQuestion[]>([]);
  const [initialTotal, setInitialTotal] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [firstTryCorrectSet, setFirstTryCorrectSet] = useState<Set<string>>(new Set());
  const [everMissedSet, setEverMissedSet] = useState<Set<string>>(new Set());
  const [missedCardsMap, setMissedCardsMap] = useState<Map<string, Card>>(new Map());

  // Current question interaction state
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize or restart quiz
  const handleStartQuiz = useCallback((config: QuizConfig) => {
    const questions = generateQuizQuestions(cardPool, config);
    if (questions.length === 0) {
      alert('No questions could be generated for the selected criteria and pool.');
      return;
    }

    setQuizQueue(questions);
    setInitialTotal(questions.length);
    setCompletedCount(0);
    setFirstTryCorrectSet(new Set());
    setEverMissedSet(new Set());
    setMissedCardsMap(new Map());

    setIsAnswered(false);
    setIsCorrect(false);
    setUserAnswer('');
    setSelectedOption(null);
    setIsFinished(false);
    setIsConfigOpen(false);
  }, [cardPool]);

  const currentQuestion = quizQueue[0] || null;

  // Handle Multiple Choice selection
  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(option);
    setUserAnswer(option);

    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      if (!everMissedSet.has(currentQuestion.id)) {
        setFirstTryCorrectSet(prev => new Set(prev).add(currentQuestion.id));
      }
    } else {
      setEverMissedSet(prev => new Set(prev).add(currentQuestion.id));
      setMissedCardsMap(prev => new Map(prev).set(currentQuestion.card.id, currentQuestion.card));
    }
  };

  // Handle Write-In answer submission
  const handleSubmitWriteIn = (text: string) => {
    if (isAnswered || !currentQuestion) return;

    setUserAnswer(text);

    let correct = false;
    switch (currentQuestion.drillType) {
      case 'definitions':
        correct = evaluateDefinitionAnswer(text, currentQuestion.correctAnswer);
        break;
      case 'conjugations':
        correct = evaluateConjugationAnswer(text, currentQuestion.card);
        break;
      case 'declensions':
        correct = evaluateDeclensionAnswer(text, currentQuestion.card);
        break;
      case 'principal_parts':
        correct = evaluatePrincipalPartsAnswer(text, currentQuestion.correctAnswer);
        break;
    }

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      if (!everMissedSet.has(currentQuestion.id)) {
        setFirstTryCorrectSet(prev => new Set(prev).add(currentQuestion.id));
      }
    } else {
      setEverMissedSet(prev => new Set(prev).add(currentQuestion.id));
      setMissedCardsMap(prev => new Map(prev).set(currentQuestion.card.id, currentQuestion.card));
    }
  };

  // Handle "I was right" override
  const handleOverrideCorrect = () => {
    if (!currentQuestion) return;
    setIsCorrect(true);
    // Remove from missed
    setEverMissedSet(prev => {
      const next = new Set(prev);
      next.delete(currentQuestion.id);
      return next;
    });
    setMissedCardsMap(prev => {
      const next = new Map(prev);
      next.delete(currentQuestion.card.id);
      return next;
    });
    setFirstTryCorrectSet(prev => new Set(prev).add(currentQuestion.id));
  };

  // Advance to next question or complete
  const handleContinue = () => {
    if (!currentQuestion) return;

    if (isCorrect) {
      // Remove question from head of queue
      const nextQueue = quizQueue.slice(1);
      const newCompleted = completedCount + 1;
      setCompletedCount(newCompleted);

      if (nextQueue.length === 0) {
        setIsFinished(true);
        setQuizQueue([]);
      } else {
        setQuizQueue(nextQueue);
      }
    } else {
      // "Bring around questions they got wrong at the end of the list until they get it right"
      const failed = currentQuestion;
      const remaining = quizQueue.slice(1);
      setQuizQueue([...remaining, failed]);
    }

    // Reset interaction state
    setIsAnswered(false);
    setIsCorrect(false);
    setUserAnswer('');
    setSelectedOption(null);
  };

  const handleExit = () => {
    navigate(backPath);
  };

  if (isLoading || chapters.length === 0) {
    return (
      <div className="p-16 text-center text-muted-foreground">
        Loading quiz materials...
      </div>
    );
  }

  const progressPercent = initialTotal > 0
    ? (completedCount / initialTotal) * 100
    : 0;

  const revisitCount = quizQueue.filter(q => everMissedSet.has(q.id)).length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-12">
      {/* Quiz Top Header with Progress Bar */}
      {!isFinished && !isConfigOpen && (
        <QuizHeader
          currentIndex={Math.min(initialTotal, completedCount + 1)}
          totalQuestions={initialTotal}
          revisitCount={revisitCount}
          progressPercent={progressPercent}
          sessionTitle={sessionTitle}
          onExit={handleExit}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-6">
        {isFinished ? (
          <QuizSummary
            totalInitialQuestions={initialTotal}
            firstTryCorrectCount={firstTryCorrectSet.size}
            missedCards={Array.from(missedCardsMap.values())}
            sessionTitle={sessionTitle}
            onRestart={() => setIsConfigOpen(true)}
            onExit={handleExit}
          />
        ) : currentQuestion ? (
          <QuizCard
            question={currentQuestion}
            isAnswered={isAnswered}
            isCorrect={isCorrect}
            selectedOption={selectedOption}
            userAnswer={userAnswer}
            onSelectOption={handleSelectOption}
            onSubmitWriteIn={handleSubmitWriteIn}
            onContinue={handleContinue}
            onOverrideCorrect={handleOverrideCorrect}
          />
        ) : (
          <div className="text-center p-8 space-y-4">
            <p className="text-muted-foreground">Ready to test your memory?</p>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition"
            >
              Configure Quiz
            </button>
          </div>
        )}
      </div>

      {/* Config Dialog */}
      <QuizConfigModal
        isOpen={isConfigOpen}
        onClose={() => {
          if (quizQueue.length === 0) {
            handleExit();
          } else {
            setIsConfigOpen(false);
          }
        }}
        onStartQuiz={handleStartQuiz}
        title={sessionTitle}
        totalCards={cardPool.length}
      />
    </div>
  );
}
