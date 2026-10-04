import { useDataStore } from '../stores/dataStore';
import { ChapterGroup, groupChaptersByBase } from '../components/chapter/ChapterGroup';

export function ChaptersPage() {
  const { chapters, isLoading } = useDataStore();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Chapters</h1>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3">
        {groupChaptersByBase(chapters).map((group) => (
          <ChapterGroup key={group.baseNumber} baseNumber={group.baseNumber} chapters={group.chapters} />
        ))}
      </div>
    </div>
  );
}
