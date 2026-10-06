import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { useUserStore } from '../stores/userStore';
import { GrammarBadge } from '../components/grammar/GrammarBadge';
import { EditGrammarModal } from '../components/grammar/EditGrammarModal';
import { generateVocabulaLink, generateLatinIsSimpleLink, generateCactusLink } from '../lib/latinNormalize';
import { ArrowLeft, Play, Star, CheckCircle, Check, ExternalLink, Tag, HelpCircle } from 'lucide-react';
import type { Card } from '../types';

export function ChapterDetailPage() {
  const { slug } = useParams();
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const { chapters } = useDataStore();
  const { cardProgress, toggleFavorite, toggleMemorized } = useUserStore();

  const chapter = useMemo(() => {
    return chapters.find(c => c.chapter === slug);
  }, [chapters, slug]);

  if (!chapter) return <div className="p-8 text-center text-muted-foreground">Chapter not found</div>;

  const totalCards = Object.values(chapter.categories).reduce((sum, cat) => sum + cat.cards.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="flex items-center space-x-3">
          <Link to="/chapters" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{chapter.chapter_title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{totalCards} vocabulary items</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <Link 
            to={`/study/${chapter.chapter}`} 
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition shadow-sm text-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Study ({totalCards})</span>
          </Link>

          <Link 
            to={`/quiz/${chapter.chapter}`} 
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition shadow-sm text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quiz Chapter</span>
          </Link>
        </div>
      </div>
      
      <div className="space-y-8">
        {Object.entries(chapter.categories).map(([catKey, category]) => (
          <div key={catKey} className="space-y-3">
            <div className="flex items-center justify-between border-b pb-1.5">
              <h2 className="text-lg font-bold tracking-tight">{category.display_name}</h2>
              <span className="text-xs text-muted-foreground font-mono">{category.cards.length} words</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.cards.map((card) => {
                const progress = cardProgress[card.id] || { favorite: false, memorized: false };

                return (
                  <div key={card.id} className="rounded-xl border p-4 shadow-sm bg-card hover:border-primary/40 transition flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-base text-foreground leading-snug">{card.term}</div>
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => setEditingCard(card)}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground/60 hover:text-primary transition"
                            title="Edit classification (Honor system)"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleFavorite(card.id)}
                            className={`p-1 rounded-md hover:bg-muted transition ${progress.favorite ? 'text-yellow-500' : 'text-muted-foreground/60'}`}
                            title={progress.favorite ? 'Favorited' : 'Favorite word'}
                          >
                            <Star className="w-4 h-4" fill={progress.favorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => toggleMemorized(card.id)}
                            className="p-1 rounded-md hover:bg-muted transition"
                            title={progress.memorized ? 'Memorized' : 'Mark as memorized'}
                          >
                            {progress.memorized ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </div>
                            ) : (
                              <CheckCircle className="w-4 h-4 text-muted-foreground/60" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground mt-1.5">{card.definition}</div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                      <GrammarBadge grammar={card.grammar} partOfSpeech={card.partOfSpeech} />

                      {/* Dictionary links */}
                      <div className="flex items-center space-x-2 text-xs">
                        <a
                          href={generateVocabulaLink(card.term)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:underline flex items-center"
                          title="Vocabula.lat"
                        >
                          Vocabula <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                        <a
                          href={generateLatinIsSimpleLink(card.term)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-500 hover:underline flex items-center"
                          title="Latin is Simple"
                        >
                          Latin is Simple <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                        {card.partOfSpeech === 'verb' && (
                          <a
                            href={generateCactusLink(card.term)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-500 hover:underline flex items-center"
                            title="Cactus 2000"
                          >
                            Cactus 2000 <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <EditGrammarModal
        isOpen={!!editingCard}
        onClose={() => setEditingCard(null)}
        card={editingCard}
      />
    </div>
  );
}
