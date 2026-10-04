import { useDataStore } from '../stores/dataStore';
import { ChapterGroup, groupChaptersByBase } from '../components/chapter/ChapterGroup';

export function ChaptersPage() {
  const { chapters, isLoading } = useDataStore();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Chapters</h1>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {groupChaptersByBase(chapters).map((group) => (
          <ChapterGroup key={group.baseNumber} baseNumber={group.baseNumber} chapters={group.chapters} />
        ))}
      </div>
    </div>
  );
}
