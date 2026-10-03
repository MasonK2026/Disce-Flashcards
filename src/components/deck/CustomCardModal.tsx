import { useState } from 'react';
import { useDeckStore } from '../../stores/deckStore';
import { X, Plus, Sparkles } from 'lucide-react';
import type { Card } from '../../types';

interface CustomCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDeckId?: string;
}

export function CustomCardModal({ isOpen, onClose, targetDeckId }: CustomCardModalProps) {
  const { createCustomCard, addCardToDeck, decks } = useDeckStore();

  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [pos, setPos] = useState('verb');
  const [selectedDeck, setSelectedDeck] = useState(targetDeckId || (decks[0]?.id || ''));

  // Verb fields
  const [conjugation, setConjugation] = useState<number | undefined>(1);
  const [isDeponent, setIsDeponent] = useState(false);
  const [isIrregular, setIsIrregular] = useState(false);

  // Noun fields
  const [declension, setDeclension] = useState<number | undefined>(1);
  const [gender, setGender] = useState('f.');

  // Adjective fields
  const [adjectiveType, setAdjectiveType] = useState('1st/2nd Decl.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;

    let grammarInfo: Card['grammar'] = {};

    if (pos === 'verb') {
      let conjLabel = isIrregular ? 'Irregular' : `${conjugation}st Conj.`;
      if (conjugation === 2) conjLabel = '2nd Conj.';
      if (conjugation === 3) conjLabel = '3rd Conj.';
      if (conjugation === 4) conjLabel = '4th Conj.';
      if (isDeponent) conjLabel = `${conjugation} Deponent`;

      grammarInfo = {
        conjugation: isIrregular ? undefined : conjugation,
        conjugationLabel: conjLabel,
        isDeponent,
        isIrregular,
      };
    } else if (pos === 'noun') {
      let declLabel = `${declension}st Decl.`;
      if (declension === 2) declLabel = '2nd Decl.';
      if (declension === 3) declLabel = '3rd Decl.';
      if (declension === 4) declLabel = '4th Decl.';
      if (declension === 5) declLabel = '5th Decl.';

      let genderLabel = 'feminine';
      if (gender === 'm.') genderLabel = 'masculine';
      if (gender === 'n.') genderLabel = 'neuter';
      if (gender.includes('pl')) genderLabel += ' plural';

      grammarInfo = {
        declension,
        declensionLabel: declLabel,
        gender,
        genderLabel,
      };
    } else if (pos === 'adjective') {
      grammarInfo = {
        adjectiveType,
      };
    }

    const newCard = createCustomCard({
      term: term.trim(),
      definition: definition.trim(),
      partOfSpeech: pos,
      grammar: grammarInfo,
    });

    if (selectedDeck) {
      addCardToDeck(selectedDeck, newCard.id);
    }

    // Reset form
    setTerm('');
    setDefinition('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-2xl border bg-background shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Add Custom Vocabulary Card</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Term Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Latin Term / Principal Parts
            </label>
            <input
              type="text"
              required
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. cōnficiō, -ere, cōnfēcī, cōnfectum"
              className="w-full px-3 py-2 rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            />
          </div>

          {/* Definition Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              English Definition
            </label>
            <input
              type="text"
              required
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="e.g. I finish, complete, accomplish"
              className="w-full px-3 py-2 rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            />
          </div>

          {/* Part of Speech */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Part of Speech
            </label>
            <select
              value={pos}
              onChange={(e) => setPos(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            >
              <option value="verb">Verb</option>
              <option value="noun">Noun</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
              <option value="preposition">Preposition</option>
              <option value="conjunction">Conjunction</option>
              <option value="pronoun">Pronoun</option>
              <option value="other">Other / Phrase</option>
            </select>
          </div>

          {/* DYNAMIC VERB FIELDS */}
          {pos === 'verb' && (
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">
                Verb Grammar Details
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Conjugation</label>
                  <select
                    disabled={isIrregular}
                    value={conjugation}
                    onChange={(e) => setConjugation(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-card text-xs focus:outline-none disabled:opacity-50"
                  >
                    <option value={1}>1st (-āre)</option>
                    <option value={2}>2nd (-ēre)</option>
                    <option value={3}>3rd (-ere)</option>
                    <option value={4}>4th (-īre)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDeponent}
                      onChange={(e) => setIsDeponent(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary/40"
                    />
                    <span>Deponent Verb</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-semibold text-red-600 dark:text-red-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isIrregular}
                      onChange={(e) => setIsIrregular(e.target.checked)}
                      className="rounded border-border text-red-600 focus:ring-red-400"
                    />
                    <span>Irregular Verb</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC NOUN FIELDS */}
          {pos === 'noun' && (
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">
                Noun Grammar Details
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Declension</label>
                  <select
                    value={declension}
                    onChange={(e) => setDeclension(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-card text-xs focus:outline-none"
                  >
                    <option value={1}>1st Declension (-ae)</option>
                    <option value={2}>2nd Declension (-ī)</option>
                    <option value={3}>3rd Declension (-is)</option>
                    <option value={4}>4th Declension (-ūs)</option>
                    <option value={5}>5th Declension (-eī/-ēī)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border bg-card text-xs focus:outline-none"
                  >
                    <option value="f.">Feminine (f.)</option>
                    <option value="m.">Masculine (m.)</option>
                    <option value="n.">Neuter (n.)</option>
                    <option value="f. pl.">Feminine Plural (f. pl.)</option>
                    <option value="m. pl.">Masculine Plural (m. pl.)</option>
                    <option value="n. pl.">Neuter Plural (n. pl.)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC ADJECTIVE FIELDS */}
          {pos === 'adjective' && (
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">
                Adjective Grammar Details
              </label>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Adjective Declension Pattern</label>
                <select
                  value={adjectiveType}
                  onChange={(e) => setAdjectiveType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border bg-card text-xs focus:outline-none"
                >
                  <option value="1st/2nd Decl.">1st/2nd Declension (-us, -a, -um / -er, -a, -um)</option>
                  <option value="3rd Decl.">3rd Declension</option>
                  <option value="Indeclinable">Indeclinable</option>
                </select>
              </div>
            </div>
          )}

          {/* Add to Deck Option */}
          {decks.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Add Directly to Custom Deck (Optional)
              </label>
              <select
                value={selectedDeck}
                onChange={(e) => setSelectedDeck(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-card text-foreground focus:outline-none text-sm"
              >
                <option value="">None (Custom pool only)</option>
                {decks.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
