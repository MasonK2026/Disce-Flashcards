import { useEffect, useMemo } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useUserStore } from '../stores/userStore';
import { useDeckStore } from '../stores/deckStore';
import { Link } from 'react-router-dom';
import { Play, Star, BookOpen, Layers, Zap, Sparkles, PenTool } from 'lucide-react';
import { ChapterGroup, groupChaptersByBase } from '../components/chapter/ChapterGroup';

const XP_PER_WORD = 10;

const RANKS = [
  { name: 'Tiro', title: 'Novice', minWords: 0, level: 1, desc: 'Just started memorizing words' },
  { name: 'Discipulus', title: 'Student', minWords: 50, level: 2, desc: '50 words memorized' },
  { name: 'Lector', title: 'Reader', minWords: 150, level: 3, desc: '150 words memorized' },
  { name: 'Notarius', title: 'Scribe', minWords: 300, level: 4, desc: '300 words memorized' },
  { name: 'Eruditus', title: 'Scholar', minWords: 500, level: 5, desc: '500 words memorized' },
  { name: 'Lexicon', title: 'Word Collector', minWords: 750, level: 6, desc: '750 words memorized' },
  { name: 'Thesaurus', title: 'Word Vault', minWords: 1000, level: 7, desc: '1,000+ words memorized' },
];

export function HomePage() {
  const { chapters, allCards, isLoading, error, loadData } = useDataStore();
  const { cardProgress, lastStudySession } = useUserStore();
  const { decks, customCards } = useDeckStore();

  useEffect(() => {
    if (chapters.length === 0 && !isLoading) {
      loadData();
    }
  }, [chapters, isLoading, loadData]);

  const totalCards = allCards.length;
  const memorizedCount = Object.values(cardProgress).filter(p => p.memorized).length;
  const favoriteCount = Object.values(cardProgress).filter(p => p.favorite).length;
  const totalXp = memorizedCount * XP_PER_WORD;

  // Vocab XP and Rank calculation
  const rankInfo = useMemo(() => {
    let currentIdx = 0;
    for (let i = 0; i < RANKS.length; i++) {
      if (memorizedCount >= RANKS[i].minWords) {
        currentIdx = i;
      }
    }
    const current = RANKS[currentIdx];
    const next = RANKS[currentIdx + 1] || null;
    const wordsNeeded = next ? next.minWords - memorizedCount : 0;
    const xpNeeded = wordsNeeded * XP_PER_WORD;
    const currentBaseXp = current.minWords * XP_PER_WORD;
    const nextBaseXp = next ? next.minWords * XP_PER_WORD : currentBaseXp;
    const rankProgress = next 
      ? Math.min(100, Math.round(((totalXp - currentBaseXp) / (nextBaseXp - currentBaseXp)) * 100))
      : 100;

    return { current, next, wordsNeeded, xpNeeded, rankProgress, currentIdx };
  }, [memorizedCount, totalXp]);

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading Disce! vocabulary...</div>;
  if (error) return <div className="p-12 text-center text-red-500">Error loading data: {error}</div>;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tight text-primary">Disce!</h1>
          <p className="text-muted-foreground mt-1 text-base md:text-lg">
            Oxford Latin Course Companion Study System
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lastStudySession && (
            <Link
              to={`/study/${lastStudySession.source}`}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-semibold hover:bg-primary/20 transition shadow-sm text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume: {lastStudySession.label}</span>
            </Link>
          )}

          <Link
            to="/study/active"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition shadow-sm text-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Study All Vocabulary ({totalCards} Words)</span>
          </Link>

          {favoriteCount > 0 && (
            <Link
              to="/favorites"
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium hover:bg-amber-500/20 transition text-sm"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>View Favorites ({favoriteCount})</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Words</span>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-primary">{totalCards + customCards.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Oxford & user created</p>
        </div>

        <Link to="/decks" className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm hover:border-indigo-500/50 transition cursor-pointer group">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-indigo-500 transition">Custom Decks</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-indigo-600 dark:text-indigo-400">{decks.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Personalized vocabulary sets</p>
        </Link>

        <Link to="/favorites" className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm hover:border-amber-500/50 transition cursor-pointer group">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-amber-600 transition">Favorites</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-amber-600 dark:text-amber-400">{favoriteCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Manage starred words</p>
        </Link>

        <Link to="/decks" className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm hover:border-emerald-500/50 transition cursor-pointer group">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-500 transition">Custom Words</span>
            <PenTool className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-emerald-600 dark:text-emerald-400">{customCards.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Words added manually</p>
        </Link>
      </div>

      {/* Gamified Vocab XP & Rank */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>Vocabulary Rank & XP</span>
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
            {totalXp.toLocaleString()} XP • Level {rankInfo.current.level}
          </span>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-2xl font-black tracking-tight">{rankInfo.current.name}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    Level {rankInfo.current.level}
                  </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">
                  {rankInfo.current.title} • {rankInfo.current.desc}
                </p>
              </div>
            </div>

            {rankInfo.next ? (
              <div className="sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next Rank</span>
                <p className="text-base font-bold text-foreground">{rankInfo.next.name} (Level {rankInfo.next.level})</p>
                <p className="text-xs text-primary font-semibold mt-0.5">
                  {rankInfo.wordsNeeded} more {rankInfo.wordsNeeded === 1 ? 'word' : 'words'} to unlock (+{rankInfo.xpNeeded} XP)
                </p>
              </div>
            ) : (
              <div className="sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Max Rank Reached</span>
                <p className="text-base font-bold text-foreground">1,000+ words memorized</p>
              </div>
            )}
          </div>

          {/* Progress bar to next rank */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>{rankInfo.current.name} ({rankInfo.current.minWords * XP_PER_WORD} XP)</span>
              <span>{rankInfo.next ? `${rankInfo.next.name} (${rankInfo.next.minWords * XP_PER_WORD} XP)` : 'Completed'}</span>
            </div>
            <div className="w-full bg-muted h-3 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500 shadow-xs" 
                style={{ width: `${rankInfo.rankProgress}%` }} 
              />
            </div>
          </div>

          {/* Roadmap of Ranks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-border/40">
            {RANKS.map((r) => {
              const isAchieved = memorizedCount >= r.minWords;
              const isCurrent = r.name === rankInfo.current.name;
              return (
                <div
                  key={r.name}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    isCurrent
                      ? 'border-amber-500 bg-amber-500/10 font-bold'
                      : isAchieved
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-muted-foreground'
                      : 'border-border/40 bg-muted/20 opacity-50 text-muted-foreground'
                  }`}
                >
                  <span className="text-[10px] font-mono block opacity-70">Level {r.level}</span>
                  <span className="text-xs font-bold block truncate">{r.name}</span>
                  <span className="text-[10px] text-muted-foreground block">{r.minWords * XP_PER_WORD} XP</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Browse All Chapters */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Browse All Chapters</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click on any chapter or expand subsections to study specific readings.
          </p>
        </div>

        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3">
          {groupChaptersByBase(chapters).map((group) => (
            <ChapterGroup key={group.baseNumber} baseNumber={group.baseNumber} chapters={group.chapters} />
          ))}
        </div>
      </div>
    </div>
  );
}
