import { useUserStore } from '../../stores/userStore';
import { useDataStore, CHAPTER_PARTS } from '../../stores/dataStore';
import { X, CheckSquare, Square, Layers, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubgroupSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubgroupSelectorModal({ isOpen, onClose }: SubgroupSelectorModalProps) {
  const navigate = useNavigate();
  const { chapters } = useDataStore();
  const { settings, toggleChapter, selectAllChapters, deselectAllChapters, togglePart } = useUserStore();

  if (!isOpen) return null;

  const activeChapters = settings.activeChapters;

  // Calculate total cards in current active selection
  const totalActiveCards = chapters
    .filter(ch => activeChapters.includes(ch.chapter))
    .reduce((sum, ch) => {
      return sum + Object.values(ch.categories).reduce((catSum, cat) => catSum + cat.cards.length, 0);
    }, 0);

  const handleStudyActive = () => {
    onClose();
    navigate('/study/active');
  };

  const getChapterCardCount = (slug: string) => {
    const ch = chapters.find(c => c.chapter === slug);
    if (!ch) return 0;
    return Object.values(ch.categories).reduce((sum, cat) => sum + cat.cards.length, 0);
  };

  const getChapterTitle = (slug: string) => {
    const ch = chapters.find(c => c.chapter === slug);
    return ch?.chapter_title || slug;
  };

  const renderPartSection = (partNum: 1 | 2 | 3, partTitle: string, chaptersInPart: string[]) => {
    const allSelected = chaptersInPart.every(c => activeChapters.includes(c));
    const someSelected = chaptersInPart.some(c => activeChapters.includes(c));

    return (
      <div className="space-y-3 p-4 rounded-xl border bg-card/60">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => togglePart(partNum)}
              className="flex items-center space-x-2 text-left font-semibold text-base hover:text-primary transition"
            >
              {allSelected ? (
                <CheckSquare className="w-5 h-5 text-primary" />
              ) : (
                <Square className={`w-5 h-5 ${someSelected ? 'text-primary/60' : 'text-muted-foreground'}`} />
              )}
              <span>{partTitle}</span>
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            {chaptersInPart.filter(c => activeChapters.includes(c)).length} / {chaptersInPart.length} selected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
          {chaptersInPart.map((slug) => {
            const isChecked = activeChapters.includes(slug);
            const count = getChapterCardCount(slug);
            return (
              <button
                key={slug}
                onClick={() => toggleChapter(slug)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition ${
                  isChecked
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-muted/40 border-transparent text-muted-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  {isChecked ? (
                    <CheckSquare className="w-3.5 h-3.5 shrink-0 text-primary" />
                  ) : (
                    <Square className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                  )}
                  <span className="truncate">{getChapterTitle(slug)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Chapter Subgroup Selector</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-muted/30 border-b text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={selectAllChapters}
              className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 font-medium transition"
            >
              Select All
            </button>
            <button
              onClick={deselectAllChapters}
              className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 font-medium transition"
            >
              Deselect All
            </button>
          </div>

          <div className="text-muted-foreground">
            <span className="font-semibold text-foreground">{activeChapters.length}</span> chapters active ({totalActiveCards} words)
          </div>
        </div>

        {/* Scrollable Chapter Lists by Part */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {renderPartSection(1, 'Part I: Chapters 1 – 9', CHAPTER_PARTS[1])}
          {renderPartSection(2, 'Part II: Chapters 10 – 20', CHAPTER_PARTS[2])}
          {renderPartSection(3, 'Part III: Chapters 21 – 31', CHAPTER_PARTS[3])}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition"
          >
            Done
          </button>

          <button
            onClick={handleStudyActive}
            disabled={totalActiveCards === 0}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Play className="w-4 h-4" />
            <span>Study Selection ({totalActiveCards} cards)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
