import { useDataStore } from '../stores/dataStore';
import { Link } from 'react-router-dom';

export function ChaptersPage() {
  const { chapters, isLoading } = useDataStore();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Chapters</h1>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {chapters.map((ch) => {
          const totalCards = Object.values(ch.categories).reduce((sum, cat) => sum + cat.cards.length, 0);
          return (
            <Link key={ch.chapter} to={`/chapters/${ch.chapter}`} className="block">
              <div className="rounded-xl border bg-card text-card-foreground shadow p-4 transition hover:bg-muted/50 cursor-pointer">
                <h3 className="font-semibold text-lg">{ch.chapter_title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{totalCards} cards</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {Object.values(ch.categories).map(c => c.display_name).join(', ')}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
