import { useState, useEffect } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { useDeckStore } from '../../stores/deckStore';
import { X, Check, Tag } from 'lucide-react';
import type { Card, GrammarInfo } from '../../types';

interface EditGrammarModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
}

const ORDINALS: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th' };

export function EditGrammarModal({ isOpen, onClose, card }: EditGrammarModalProps) {
  const { setCardGrammarOverride, grammarOverrides } = useDataStore();
  const { updateCustomCard } = useDeckStore();

  const [pos, setPos] = useState('verb');
  const [conjugation, setConjugation] = useState<number | undefined>(1);
  const [isDeponent, setIsDeponent] = useState(false);
  const [isIrregular, setIsIrregular] = useState(false);
  const [declension, setDeclension] = useState<number | undefined>(1);
  const [gender, setGender] = useState('f.');
  const [adjectiveType, setAdjectiveType] = useState('1st/2nd Decl.');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (card) {
      setPos(card.partOfSpeech || 'verb');
      setConjugation(card.grammar?.conjugation || 1);
      setIsDeponent(card.grammar?.isDeponent || false);
      setIsIrregular(card.grammar?.isIrregular || false);
      setDeclension(card.grammar?.declension || 1);
      setGender(card.grammar?.gender || 'f.');
      setAdjectiveType(card.grammar?.adjectiveType || '1st/2nd Decl.');
      setSaveError(null);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const isCustom = card.id.startsWith('custom_');
  const isOverridden = !isCustom && !!grammarOverrides[card.id];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let grammarInfo: GrammarInfo = {};

    if (pos === 'verb') {
      const conjOrdinal = ORDINALS[conjugation ?? 1];
      let conjLabel = `${conjOrdinal} Conj.`;
      if (isIrregular) conjLabel = 'Irregular';
      else if (isDeponent) conjLabel = `${conjOrdinal} Deponent`;

      grammarInfo = {
        conjugation: isIrregular ? undefined : conjugation,
        conjugationLabel: conjLabel,
        isDeponent,
        isIrregular,
      };
    } else if (pos === 'noun') {
      const declLabel = `${ORDINALS[declension ?? 1]} Decl.`;

      let genderLabel = 'feminine';
      if (gender.startsWith('m')) genderLabel = 'masculine';
      if (gender.startsWith('n')) genderLabel = 'neuter';
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

    setSaveError(null);

    // Custom cards only exist on this device, so they're edited locally.
    if (isCustom) {
      updateCustomCard(card.id, { partOfSpeech: pos, grammar: grammarInfo });
      onClose();
      return;
    }

    setIsSaving(true);
    const result = await setCardGrammarOverride(card.id, pos, grammarInfo);
    setIsSaving(false);

    if (result.ok) {
      onClose();
    } else {
      setSaveError(result.error ?? 'Could not save. Check your connection and try again.');
    }
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Edit Word Classification</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Target Word Info */}
          <div className="p-3.5 rounded-xl border bg-card/60">
            <div className="text-base font-bold text-foreground">{card.term}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{card.definition}</div>
            {isOverridden && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Community Modified
              </span>
            )}
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

          {/* VERB GRAMMAR FIELDS */}
          {pos === 'verb' && (
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">
                Verb Conjugation & Properties
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

          {/* NOUN GRAMMAR FIELDS */}
          {pos === 'noun' && (
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">
                Noun Declension & Gender
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

          {/* ADJECTIVE GRAMMAR FIELDS */}
          {pos === 'adjective' && (
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">
                Adjective Declension Pattern
              </label>

              <div className="space-y-1">
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

          {/* Honor System Info Banner */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-semibold">🤝 Honor System</p>
            <p>
              {isCustom
                ? 'This is one of your custom cards, so this change is saved on this device only.'
                : 'Saved to the shared database: everyone will see this change. Please only correct genuine mistakes.'}
            </p>
          </div>

          {saveError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300">
              {saveError}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving…' : isCustom ? 'Save' : 'Save for Everyone'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
