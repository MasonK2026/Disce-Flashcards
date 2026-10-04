import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Chapter } from '../../types';

interface ChapterGroupProps {
  baseNumber: string;
  chapters: Chapter[];
}

export function ChapterGroup({ baseNumber, chapters }: ChapterGroupProps) {
  const [isOpen, setIsOpen] = useState(false);

  // If there's only one chapter (e.g., Chapter 1), we can just render it directly
  if (chapters.length === 1) {
    const ch = chapters[0];
    const count = Object.values(ch.categories).reduce((sum, cat) => sum + cat.cards.length, 0);
    return (
      <Link
        to={`/chapters/${ch.chapter}`}
        className="group p-4 rounded-xl border bg-card hover:bg-muted/40 transition flex items-center justify-between break-inside-avoid mb-3 shadow-xs"
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
  }

  // Grouped display
  const totalCount = chapters.reduce((total, ch) => {
    return total + Object.values(ch.categories).reduce((sum, cat) => sum + cat.cards.length, 0);
  }, 0);

  return (
    <div className="relative break-inside-avoid mb-3">
      <div className="rounded-xl border bg-card shadow-xs transition-colors hover:border-primary/50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-4 flex items-center justify-between transition-colors"
        >
          <div className="text-left">
            <h4 className="font-bold text-sm">Chapter {baseNumber}</h4>
            <span className="text-xs text-muted-foreground">{totalCount} total cards</span>
          </div>
          <div className="text-muted-foreground">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-10 top-full left-0 w-full mt-2 rounded-xl border bg-card shadow-lg overflow-hidden divide-y divide-border/40 animate-in fade-in slide-in-from-top-2 duration-200">
          {chapters.map(ch => {
            const count = Object.values(ch.categories).reduce((sum, cat) => sum + cat.cards.length, 0);
            return (
              <Link
                key={ch.chapter}
                to={`/chapters/${ch.chapter}`}
                className="group p-3 px-4 hover:bg-muted/40 transition flex items-center justify-between block"
              >
                <div>
                  <h5 className="font-semibold text-sm group-hover:text-primary transition">{ch.chapter_title}</h5>
                  <span className="text-xs text-muted-foreground">{count} cards</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition">
                  Open →
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper to group chapters by their base number
export function groupChaptersByBase(chapters: Chapter[]) {
  const groups = new Map<string, Chapter[]>();
  
  chapters.forEach(ch => {
    // extract base number: "ch2a" -> "2", "ch10b" -> "10"
    const match = ch.chapter.match(/^ch(\d+)/);
    const baseNumber = match ? match[1] : ch.chapter;
    
    if (!groups.has(baseNumber)) {
      groups.set(baseNumber, []);
    }
    groups.get(baseNumber)!.push(ch);
  });
  
  return Array.from(groups.entries()).map(([baseNumber, chs]) => ({
    baseNumber,
    chapters: chs
  }));
}
