import { useEffect } from 'react';
import { useDataStore, CHAPTER_PARTS } from '../stores/dataStore';
import { useUserStore } from '../stores/userStore';
import { Link } from 'react-router-dom';
import { Play, Star, CheckCircle, BookOpen, Layers, ArrowRight } from 'lucide-react';

export function HomePage() {
  const { chapters, allCards, isLoading, error, loadData } = useDataStore();
  const { settings, cardProgress, lastStudySession } = useUserStore();

  useEffect(() => {
    if (chapters.length === 0 && !isLoading) {
      loadData();
    }
  }, [chapters, isLoading, loadData]);

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading Disce! vocabulary...</div>;
  if (error) return <div className="p-12 text-center text-red-500">Error loading data: {error}</div>;

  const totalCards = allCards.length;
  const activeSlugs = settings.activeChapters;
  const activeCards = allCards.filter(card => activeSlugs.includes(card.id.split('_')[0]));

  const memorizedCount = Object.values(cardProgress).filter(p => p.memorized).length;
  const favoriteCount = Object.values(cardProgress).filter(p => p.favorite).length;
  const overallPercent = totalCards > 0 ? Math.round((memorizedCount / totalCards) * 100) : 0;

  // Calculate part stats
  const getPartStats = (partChapters: string[]) => {
    const partCards = allCards.filter(c => partChapters.includes(c.id.split('_')[0]));
    const partMemorized = partCards.filter(c => cardProgress[c.id]?.memorized).length;
    const percent = partCards.length > 0 ? Math.round((partMemorized / partCards.length) * 100) : 0;
    return { total: partCards.length, memorized: partMemorized, percent };
  };

  const part1 = getPartStats(CHAPTER_PARTS[1]);
  const part2 = getPartStats(CHAPTER_PARTS[2]);
  const part3 = getPartStats(CHAPTER_PARTS[3]);

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
            <span>Study Selection ({activeCards.length} Words)</span>
          </Link>

          {favoriteCount > 0 && (
            <Link
              to="/study/favorites"
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium hover:bg-amber-500/20 transition text-sm"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>Favorites ({favoriteCount})</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Words</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="text-3xl font-extrabold mt-2">{totalCards}</p>
          <p className="text-xs text-muted-foreground mt-1">Across 53 chapters</p>
        </div>

        <div className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Memorized</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-emerald-600 dark:text-emerald-400">{memorizedCount}</p>
          <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${overallPercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{overallPercent}% mastery</p>
        </div>

        <div className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Favorites</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-amber-600 dark:text-amber-400">{favoriteCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Starred for review</p>
        </div>

        <div className="rounded-2xl border bg-card text-card-foreground p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pool</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <p className="text-3xl font-extrabold mt-2">{activeCards.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{activeSlugs.length} of 53 chapters</p>
        </div>
      </div>

      {/* Textbook Parts Progress */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Textbook Progress by Volume</h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          {/* Part I */}
          <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume I</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Ch. 1 – 9
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1">Part I: Beginnings</h3>
              <p className="text-xs text-muted-foreground">{part1.total} words total</p>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span>{part1.memorized} memorized</span>
                <span>{part1.percent}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${part1.percent}%` }} />
              </div>
            </div>
          </div>

          {/* Part II */}
          <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume II</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  Ch. 10 – 20
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1">Part II: Intermediate</h3>
              <p className="text-xs text-muted-foreground">{part2.total} words total</p>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span>{part2.memorized} memorized</span>
                <span>{part2.percent}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${part2.percent}%` }} />
              </div>
            </div>
          </div>

          {/* Part III */}
          <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume III</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Ch. 21 – 31
                </span>
              </div>
              <h3 className="text-lg font-bold mt-1">Part III: Advanced</h3>
              <p className="text-xs text-muted-foreground">{part3.total} words total</p>
            </div>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span>{part3.memorized} memorized</span>
                <span>{part3.percent}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${part3.percent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Chapter Access */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Browse All Chapters</h2>
          <Link to="/chapters" className="text-sm font-semibold text-primary hover:underline flex items-center">
            View All 53 <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {chapters.slice(0, 8).map((ch) => {
            const count = Object.values(ch.categories).reduce((sum, cat) => sum + cat.cards.length, 0);
            return (
              <Link
                key={ch.chapter}
                to={`/chapters/${ch.chapter}`}
                className="group p-4 rounded-xl border bg-card hover:bg-muted/40 transition flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm group-hover:text-primary transition">{ch.chapter_title}</h4>
                  <span className="text-xs text-muted-foreground">{count} cards</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition">
                  Open →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
