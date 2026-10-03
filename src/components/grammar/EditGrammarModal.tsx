import { useState, useEffect } from 'react';
import { useDataStore } from '../../stores/dataStore';
import { X, Check, Download, Tag } from 'lucide-react';
import type { Card, GrammarInfo } from '../../types';

interface EditGrammarModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
}

export function EditGrammarModal({ isOpen, onClose, card }: EditGrammarModalProps) {
  const { setCardGrammarOverride, exportOverridesJson, grammarOverrides } = useDataStore();

  const [pos, setPos] = useState('verb');
  const [conjugation, setConjugation] = useState<number | undefined>(1);
  const [isDeponent, setIsDeponent] = useState(false);
  const [isIrregular, setIsIrregular] = useState(false);
  const [declension, setDeclension] = useState<number | undefined>(1);
  const [gender, setGender] = useState('f.');
  const [adjectiveType, setAdjectiveType] = useState('1st/2nd Decl.');

  useEffect(() => {
    if (card) {
      setPos(card.partOfSpeech || 'verb');
      setConjugation(card.grammar?.conjugation || 1);
      setIsDeponent(card.grammar?.isDeponent || false);
      setIsIrregular(card.grammar?.isIrregular || false);
      setDeclension(card.grammar?.declension || 1);
      setGender(card.grammar?.gender || 'f.');
      setAdjectiveType(card.grammar?.adjectiveType || '1st/2nd Decl.');
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const isOverridden = !!grammarOverrides[card.id];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let grammarInfo: GrammarInfo = {};

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

    setCardGrammarOverride(card.id, pos, grammarInfo);
    onClose();
  };

  const handleDownloadOverrides = () => {
    const jsonStr = exportOverridesJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grammar-overrides.json';
    a.click();
    URL.revokeObjectURL(url);
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
            <p className="font-semibold">🤝 Honor System Community Overrides</p>
            <p>
              Your changes apply instantly. To ship these classifications to all users on GitHub Pages, click <strong>"Download Overrides"</strong> and place the downloaded <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">grammar-overrides.json</code> in your repository's <code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">public/data/</code> folder.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t">
            <button
              type="button"
              onClick={handleDownloadOverrides}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-border/80 text-xs font-medium hover:bg-muted transition"
              title="Download grammar-overrides.json for GitHub"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Overrides</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save for Everyone</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
