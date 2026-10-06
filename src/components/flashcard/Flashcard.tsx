import { motion } from 'framer-motion';
import type { Card } from '../../types';
import { useState } from 'react';
import { generateVocabulaLink, generateLatinIsSimpleLink, generateCactusLink } from '../../lib/latinNormalize';
import { ExternalLink, Star, CheckCircle, Check, Tag } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { GrammarBadge } from '../grammar/GrammarBadge';
import { EditGrammarModal } from '../grammar/EditGrammarModal';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  direction: 'LA-EN' | 'EN-LA';
  onFlip: () => void;
}

export function Flashcard({ card, isFlipped, direction, onFlip }: FlashcardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { cardProgress, toggleFavorite, toggleMemorized } = useUserStore();
  const progress = cardProgress[card.id] || { favorite: false, memorized: false };

  const frontText = direction === 'LA-EN' ? card.term : card.definition;
  const backText = direction === 'LA-EN' ? card.definition : card.term;

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't flip the card when clicking a link
  };

  return (
    <>
      <div 
        className="w-full max-w-2xl h-80 md:h-96 mx-auto cursor-pointer perspective-1000 relative group"
        onClick={onFlip}
      >
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* FRONT */}
          <div className="absolute w-full h-full backface-hidden rounded-2xl border bg-card text-card-foreground shadow-lg flex flex-col justify-center items-center p-6 text-center">
            
            <div className="absolute top-4 right-4 flex gap-1.5 items-center">
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
                className="p-2 rounded-full hover:bg-muted/60 text-muted-foreground/60 hover:text-primary transition"
                title="Edit classification (Honor system)"
              >
                <Tag className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(card.id); }}
                className={`p-2 rounded-full hover:bg-muted/50 transition ${progress.favorite ? 'text-amber-500' : 'text-muted-foreground'}`}
              >
                <Star className="w-5 h-5" fill={progress.favorite ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleMemorized(card.id); }}
                className="p-2 rounded-full hover:bg-muted/50 transition"
                title={progress.memorized ? 'Memorized' : 'Mark as memorized'}
              >
                {progress.memorized ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                ) : (
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>

          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            {direction === 'LA-EN' ? 'Latin' : 'English'}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold">{frontText}</h2>
          
          {direction === 'LA-EN' && (
            <div className="mt-4">
              <GrammarBadge grammar={card.grammar} partOfSpeech={card.partOfSpeech} />
            </div>
          )}

          {direction === 'LA-EN' && (
            <div 
              className="absolute bottom-7 left-0 right-0 flex flex-wrap items-center justify-center gap-2 px-3 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <a 
                href={generateVocabulaLink(card.term)} 
                target="_blank" 
                rel="noreferrer" 
                onClick={handleLinkClick}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition active:scale-95"
              >
                Vocabula <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <a 
                href={generateLatinIsSimpleLink(card.term)} 
                target="_blank" 
                rel="noreferrer" 
                onClick={handleLinkClick}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition active:scale-95"
              >
                Latin is Simple <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              {card.partOfSpeech === 'verb' && (
                <a 
                  href={generateCactusLink(card.term)} 
                  target="_blank" 
                  rel="noreferrer" 
                  onClick={handleLinkClick}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition active:scale-95"
                >
                  Cactus 2000 <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          )}
          
          <div className="absolute bottom-2 text-xs text-muted-foreground/50">
            Tap or Space to flip
          </div>
        </div>

        {/* BACK */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl border bg-secondary text-secondary-foreground shadow-lg flex flex-col justify-center items-center p-6 text-center">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            {direction === 'LA-EN' ? 'English' : 'Latin'}
          </span>
          <h2 className="text-2xl md:text-4xl font-bold">{backText}</h2>

          {direction === 'EN-LA' && (
            <div 
              className="absolute bottom-7 left-0 right-0 flex flex-wrap items-center justify-center gap-2 px-3 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <a 
                href={generateVocabulaLink(card.term)} 
                target="_blank" 
                rel="noreferrer" 
                onClick={handleLinkClick}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition active:scale-95"
              >
                Vocabula <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <a 
                href={generateLatinIsSimpleLink(card.term)} 
                target="_blank" 
                rel="noreferrer" 
                onClick={handleLinkClick}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition active:scale-95"
              >
                Latin is Simple <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              {card.partOfSpeech === 'verb' && (
                <a 
                  href={generateCactusLink(card.term)} 
                  target="_blank" 
                  rel="noreferrer" 
                  onClick={handleLinkClick}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition active:scale-95"
                >
                  Cactus 2000 <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>

    <EditGrammarModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      card={card}
    />
  </>
  );
}
