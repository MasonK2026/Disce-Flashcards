import { WordsEngine, dictionaryForm } from 'whitakers-words';
import type { ParseResult, WordsEngineData } from 'whitakers-words';
import type { Card, GrammarInfo } from '../types';

let engineInstance: WordsEngine | null = null;
let isLoading = false;

export const loadWhitakersEngine = async (): Promise<WordsEngine> => {
  if (engineInstance) return engineInstance;
  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (engineInstance) return engineInstance;
  }
  
  isLoading = true;
  try {
    const basePath = import.meta.env.BASE_URL || '/';
    const fetchText = async (file: string) => {
      // Avoid trailing slash duplicate
      const cleanBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
      const res = await fetch(`${cleanBase}/whitakers/${file}`);
      if (!res.ok) throw new Error(`Failed to load ${file}`);
      return await res.text();
    };

    const [addonsRaw, dictlineGen, dictlineSup, inflectsRaw, uniquesRaw] = await Promise.all([
      fetchText('ADDONS.LAT'),
      fetchText('DICTLINE.GEN'),
      fetchText('DICTLINE.SUP'),
      fetchText('INFLECTS.LAT'),
      fetchText('UNIQUES.LAT'),
    ]);

    const data: WordsEngineData = {
      addons: addonsRaw,
      dictline: dictlineGen + '\n' + dictlineSup,
      inflects: inflectsRaw,
      uniques: uniquesRaw,
    };

    engineInstance = WordsEngine.create(data);
    return engineInstance;
  } finally {
    isLoading = false;
  }
};

function formatDefinition(mean: string): string {
  return mean.split(';').map(s => s.trim()).filter(Boolean).join('; ');
}

function mapToCard(result: ParseResult, inputWord: string): Card {
  const { ir, de } = result;
  
  const grammar: GrammarInfo = {};
  const pofs = ir.qual.pofs;
  let partOfSpeech: string = de.part.pofs.toLowerCase();

  if (pofs === 'N') {
    partOfSpeech = 'noun';
    grammar.declension = de.part.pofs === 'N' ? de.part.n.decl.which : undefined;
    grammar.gender = de.part.pofs === 'N' ? de.part.n.gender : undefined;
  } else if (pofs === 'V') {
    partOfSpeech = 'verb';
    grammar.conjugation = de.part.pofs === 'V' ? de.part.v.con.which : undefined;
    grammar.isDeponent = de.part.pofs === 'V' && de.part.v.con.var === 2;
  } else if (pofs === 'ADJ') {
    partOfSpeech = 'adjective';
  } else if (pofs === 'ADV') {
    partOfSpeech = 'adverb';
  } else if (pofs === 'PREP') {
    partOfSpeech = 'preposition';
  } else if (pofs === 'CONJ') {
    partOfSpeech = 'conjunction';
  } else if (pofs === 'PRON') {
    partOfSpeech = 'pronoun';
  }

  const fullDictForm = dictionaryForm(de);
  const lemmaParts = fullDictForm.split('  ')[0];
  const term = lemmaParts || de.stems.filter(s => s !== 'zzz').join(', ') || inputWord;
  const definition = formatDefinition(de.mean);

  return {
    id: `whitaker-${crypto.randomUUID()}`,
    term,
    definition,
    partOfSpeech,
    grammar,
    searchForms: [inputWord],
    source: 'whitakers',
  };
}

export const searchWhitakers = async (query: string): Promise<Card[]> => {
  if (!query || query.trim().length === 0) return [];
  const engine = await loadWhitakersEngine();
  
  const firstWord = query.trim().split(/\s+/)[0];
  const analysis = engine.parseWord(firstWord);
  
  const cards: Card[] = [];
  const seenTerms = new Set<string>();

  for (const r of analysis.results) {
    const card = mapToCard(r, firstWord);
    if (!seenTerms.has(card.term)) {
      seenTerms.add(card.term);
      cards.push(card);
    }
  }

  return cards;
};
