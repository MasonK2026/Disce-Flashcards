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
  }

  // Grouped display
  const totalCount = chapters.reduce((total, ch) => {
    return total + Object.values(ch.categories).reduce((sum, cat) => sum + cat.cards.length, 0);
  }, 0);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/40 transition"
      >
        <div className="text-left">
          <h4 className="font-bold text-sm transition">Chapter {baseNumber}</h4>
          <span className="text-xs text-muted-foreground">{totalCount} total cards</span>
        </div>
        <div className="text-muted-foreground">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="bg-muted/10 border-t border-border/40 divide-y divide-border/40">
          {chapters.map(ch => {
            const count = Object.values(ch.categories).reduce((sum, cat) => sum + cat.cards.length, 0);
            return (
              <Link
                key={ch.chapter}
                to={`/chapters/${ch.chapter}`}
                className="group p-3 pl-6 hover:bg-muted/40 transition flex items-center justify-between block"
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
