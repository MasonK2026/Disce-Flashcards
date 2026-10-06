import type { Card } from '../types';
import { normalizeLatinSearch } from './latinNormalize';

export type DrillType = 'definitions' | 'conjugations' | 'declensions' | 'principal_parts';
export type QuestionFormat = 'multiple_choice' | 'write_in';

export interface QuizConfig {
  drillTypes: DrillType[]; // Which drills to include
  format: 'multiple_choice' | 'write_in' | 'mixed';
  questionCount?: number; // e.g. 10, 20, or undefined for all
  direction?: 'latin_to_english' | 'english_to_latin';
}

export interface QuizQuestion {
  id: string;
  card: Card;
  drillType: DrillType;
  format: QuestionFormat;
  prompt: string;
  promptSubtext?: string;
  questionLabel: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  options?: string[]; // 4 choices for multiple choice
  explanation: string;
}

// -------------------------------------------------------------
// Helper: Extract First Verb Form (e.g. "laudō" from principal parts)
// -------------------------------------------------------------
export function extractFirstVerbForm(term: string): string {
  const parts = term.split(',').map(p => p.trim());
  const first = parts[0] || term;
  return first.replace(/\(.*?\)/g, '').trim();
}

// -------------------------------------------------------------
// Helper: Extract Noun Lemma (e.g. "puella, -ae")
// -------------------------------------------------------------
export function extractNounLemma(term: string): string {
  const parts = term.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`;
  }
  return parts[0] || term;
}

// -------------------------------------------------------------
// Helper: Extract Remaining Principal Parts
// -------------------------------------------------------------
export function extractRemainingPrincipalParts(term: string): string {
  const parts = term.split(',').map(p => p.trim());
  if (parts.length > 1) {
    return parts.slice(1).join(', ');
  }
  return term;
}

// -------------------------------------------------------------
// Levenshtein Distance for Typo-Tolerance
// -------------------------------------------------------------
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// -------------------------------------------------------------
// Tokenize and clean definition chunks (removes to, a, an, the)
// -------------------------------------------------------------
function cleanDefinitionChunk(chunk: string): string {
  let s = chunk.toLowerCase().trim();
  // Strip parentheses
  s = s.replace(/\(.*?\)/g, '').trim();
  // Strip common English leading articles / infinitives
  s = s.replace(/^(to|a|an|the)\s+/, '').trim();
  // Strip punctuation
  s = s.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
  return s;
}

export function parseDefinitionKeys(definition: string): string[] {
  // Split on semicolons, commas, slashes, or 'or'
  const rawParts = definition.split(/[;,/]|(?:\s+or\s+)/);
  const keys = new Set<string>();

  for (const p of rawParts) {
    const cleaned = cleanDefinitionChunk(p);
    if (cleaned.length > 0) {
      keys.add(cleaned);
      // If chunk has multiple words (e.g. "make clear"), add full chunk
      const words = cleaned.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 1) {
        words.forEach(w => keys.add(w));
      }
    }
  }
  return Array.from(keys);
}

// -------------------------------------------------------------
// Multi-Definition Matcher
// Accepts single or multiple comma/semicolon/and separated inputs
// -------------------------------------------------------------
export function evaluateDefinitionAnswer(userInput: string, targetDefinition: string): boolean {
  if (!userInput || !userInput.trim()) return false;

  const validKeys = parseDefinitionKeys(targetDefinition);
  if (validKeys.length === 0) {
    return userInput.trim().toLowerCase() === targetDefinition.trim().toLowerCase();
  }

  // Parse user input into chunks
  const userChunks = userInput
    .split(/[,;/]|(?:\s+and\s+)|(?:\s+or\s+)/)
    .map(c => cleanDefinitionChunk(c))
    .filter(Boolean);

  if (userChunks.length === 0) return false;

  // If user entered exact definition string (ignoring case/punctuation)
  const cleanFullUser = cleanDefinitionChunk(userInput);
  const cleanFullTarget = cleanDefinitionChunk(targetDefinition);
  if (cleanFullUser === cleanFullTarget || cleanFullTarget.includes(cleanFullUser)) {
    return true;
  }

  // Check if at least one of the user's provided meanings is a valid match
  for (const uChunk of userChunks) {
    for (const vKey of validKeys) {
      if (uChunk === vKey) return true;
      // Stem / substring containment
      if (vKey.length >= 4 && (vKey.startsWith(uChunk) || uChunk.startsWith(vKey))) {
        return true;
      }
      // Typo tolerance: Levenshtein distance <= 1 for words length >= 4
      if (vKey.length >= 4 && uChunk.length >= 4 && levenshteinDistance(uChunk, vKey) <= 1) {
        return true;
      }
    }
  }

  return false;
}

// -------------------------------------------------------------
// Conjugation Evaluator
// -------------------------------------------------------------
export function getConjugationStandardName(card: Card): string {
  if (card.grammar?.isDeponent) {
    return `${card.grammar.conjugation || 1}st Deponent`;
  }
  if (card.grammar?.isIrregular) {
    return card.grammar.conjugationLabel || 'Irregular';
  }
  const c = card.grammar?.conjugation;
  if (c === 1) return '1st Conjugation';
  if (c === 2) return '2nd Conjugation';
  if (c === 3) {
    if (card.grammar?.conjugationLabel?.includes('-io')) return '3rd -io Conjugation';
    return '3rd Conjugation';
  }
  if (c === 4) return '4th Conjugation';
  return card.grammar?.conjugationLabel || 'Conjugation Unknown';
}

export function evaluateConjugationAnswer(userInput: string, card: Card): boolean {
  const norm = userInput.toLowerCase().trim().replace(/[-_\s]/g, '');
  const c = card.grammar?.conjugation;
  const isIo = card.grammar?.conjugationLabel?.includes('-io');
  const isDep = card.grammar?.isDeponent;
  const isIrr = card.grammar?.isIrregular;

  if (isIrr && (norm.includes('irreg') || norm.includes('irr'))) return true;
  if (isDep && (norm.includes('dep') || norm.includes('deponent'))) return true;

  if (c === 1 && (norm === '1' || norm === '1st' || norm === 'first' || norm.includes('1stconj'))) return true;
  if (c === 2 && (norm === '2' || norm === '2nd' || norm === 'second' || norm.includes('2ndconj'))) return true;
  if (c === 3) {
    if (isIo) {
      if (norm.includes('io') || norm === '3io' || norm === '3rdio') return true;
    }
    if (norm === '3' || norm === '3rd' || norm === 'third' || norm.includes('3rdconj')) return true;
  }
  if (c === 4 && (norm === '4' || norm === '4th' || norm === 'fourth' || norm.includes('4thconj'))) return true;

  return false;
}

// -------------------------------------------------------------
// Declension Evaluator
// -------------------------------------------------------------
export function getDeclensionStandardName(card: Card): string {
  const d = card.grammar?.declension;
  if (d === 1) return '1st Declension';
  if (d === 2) return '2nd Declension';
  if (d === 3) return '3rd Declension';
  if (d === 4) return '4th Declension';
  if (d === 5) return '5th Declension';
  return card.grammar?.declensionLabel || 'Declension Unknown';
}

export function evaluateDeclensionAnswer(userInput: string, card: Card): boolean {
  const norm = userInput.toLowerCase().trim().replace(/[-_\s]/g, '');
  const d = card.grammar?.declension;

  if (d === 1 && (norm === '1' || norm === '1st' || norm === 'first' || norm.includes('1stdecl'))) return true;
  if (d === 2 && (norm === '2' || norm === '2nd' || norm === 'second' || norm.includes('2nddecl'))) return true;
  if (d === 3 && (norm === '3' || norm === '3rd' || norm === 'third' || norm.includes('3rddecl'))) return true;
  if (d === 4 && (norm === '4' || norm === '4th' || norm === 'fourth' || norm.includes('4thdecl'))) return true;
  if (d === 5 && (norm === '5' || norm === '5th' || norm === 'fifth' || norm.includes('5thdecl'))) return true;

  return false;
}

// -------------------------------------------------------------
// Principal Parts Evaluator (Macron-Insensitive)
// -------------------------------------------------------------
export function evaluatePrincipalPartsAnswer(userInput: string, targetPrincipalParts: string): boolean {
  const normUser = normalizeLatinSearch(userInput).replace(/[\s,.-]+/g, ' ').trim();
  const normTarget = normalizeLatinSearch(targetPrincipalParts).replace(/[\s,.-]+/g, ' ').trim();

  if (normUser === normTarget) return true;

  // Split both into tokens
  const userTokens = normUser.split(' ').filter(Boolean);
  const targetTokens = normTarget.split(' ').filter(Boolean);

  if (userTokens.length > 0 && targetTokens.length > 0) {
    const matchCount = userTokens.filter(t => targetTokens.includes(t)).length;
    if (matchCount === targetTokens.length) return true;
  }

  return false;
}

// -------------------------------------------------------------
// Question Generator
// -------------------------------------------------------------
export function generateQuizQuestions(
  cards: Card[],
  config: QuizConfig
): QuizQuestion[] {
  if (!cards || cards.length === 0) return [];

  const questions: QuizQuestion[] = [];
  const drillTypes = config.drillTypes.length > 0 ? config.drillTypes : ['definitions'];

  // Shuffled copy of cards
  const pool = [...cards].sort(() => Math.random() - 0.5);

  for (const card of pool) {
    // Decide available drills for this card
    const availableDrills: DrillType[] = [];

    if (drillTypes.includes('definitions')) {
      availableDrills.push('definitions');
    }

    if (drillTypes.includes('conjugations') && card.partOfSpeech === 'verb' && (card.grammar?.conjugation || card.grammar?.isIrregular)) {
      availableDrills.push('conjugations');
    }

    if (drillTypes.includes('declensions') && card.partOfSpeech === 'noun' && card.grammar?.declension) {
      availableDrills.push('declensions');
    }

    if (drillTypes.includes('principal_parts') && card.partOfSpeech === 'verb' && card.term.includes(',')) {
      availableDrills.push('principal_parts');
    }

    if (availableDrills.length === 0) continue;

    // Pick one drill type for this card
    const chosenDrill = availableDrills[Math.floor(Math.random() * availableDrills.length)];

    // Decide format
    let format: QuestionFormat = 'multiple_choice';
    if (config.format === 'write_in') {
      format = 'write_in';
    } else if (config.format === 'mixed') {
      format = Math.random() > 0.5 ? 'multiple_choice' : 'write_in';
    }

    let q: QuizQuestion | null = null;

    if (chosenDrill === 'definitions') {
      const isL2E = config.direction !== 'english_to_latin';
      const prompt = isL2E ? card.term : card.definition;
      const correctAnswer = isL2E ? card.definition : card.term;

      // Multiple choice options
      let options: string[] | undefined = undefined;
      if (format === 'multiple_choice') {
        const distractors = pool
          .filter(c => c.id !== card.id)
          .map(c => isL2E ? c.definition : c.term)
          .slice(0, 3);
        options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
      }

      q = {
        id: `q_${card.id}_def`,
        card,
        drillType: 'definitions',
        format,
        prompt,
        promptSubtext: isL2E ? 'Translate to English' : 'Translate to Latin',
        questionLabel: 'Definition Drill',
        correctAnswer,
        acceptableAnswers: parseDefinitionKeys(correctAnswer),
        options,
        explanation: `${card.term} — ${card.definition}`,
      };
    } else if (chosenDrill === 'conjugations') {
      // ONLY SHOW FIRST FORM
      const firstForm = extractFirstVerbForm(card.term);
      const standardName = getConjugationStandardName(card);

      const allConjugationOptions = [
        '1st Conjugation',
        '2nd Conjugation',
        '3rd Conjugation',
        '3rd -io Conjugation',
        '4th Conjugation',
        'Irregular / Deponent',
      ];

      let options: string[] | undefined = undefined;
      if (format === 'multiple_choice') {
        const otherOptions = allConjugationOptions.filter(o => o !== standardName);
        const distractors = otherOptions.sort(() => Math.random() - 0.5).slice(0, 3);
        options = [standardName, ...distractors].sort(() => Math.random() - 0.5);
      }

      q = {
        id: `q_${card.id}_conj`,
        card,
        drillType: 'conjugations',
        format,
        prompt: firstForm,
        promptSubtext: 'First form only • Identify conjugation',
        questionLabel: 'Conjugation Drill',
        correctAnswer: standardName,
        acceptableAnswers: [standardName, `${card.grammar?.conjugation || ''}`],
        options,
        explanation: `${card.term} is ${standardName}. (${card.definition})`,
      };
    } else if (chosenDrill === 'declensions') {
      const nounForm = extractNounLemma(card.term);
      const standardName = getDeclensionStandardName(card);

      const allDeclOptions = [
        '1st Declension',
        '2nd Declension',
        '3rd Declension',
        '4th Declension',
        '5th Declension',
      ];

      let options: string[] | undefined = undefined;
      if (format === 'multiple_choice') {
        const otherOptions = allDeclOptions.filter(o => o !== standardName);
        const distractors = otherOptions.sort(() => Math.random() - 0.5).slice(0, 3);
        options = [standardName, ...distractors].sort(() => Math.random() - 0.5);
      }

      q = {
        id: `q_${card.id}_decl`,
        card,
        drillType: 'declensions',
        format,
        prompt: nounForm,
        promptSubtext: 'Identify noun declension',
        questionLabel: 'Declension Drill',
        correctAnswer: standardName,
        acceptableAnswers: [standardName, `${card.grammar?.declension || ''}`],
        options,
        explanation: `${card.term} is ${standardName}. (${card.definition})`,
      };
    } else if (chosenDrill === 'principal_parts') {
      const firstForm = extractFirstVerbForm(card.term);
      const remainingParts = extractRemainingPrincipalParts(card.term);

      let options: string[] | undefined = undefined;
      if (format === 'multiple_choice') {
        const otherVerbs = pool
          .filter(c => c.id !== card.id && c.partOfSpeech === 'verb' && c.term.includes(','))
          .map(c => extractRemainingPrincipalParts(c.term))
          .filter(p => p !== remainingParts)
          .slice(0, 3);

        options = [remainingParts, ...otherVerbs].sort(() => Math.random() - 0.5);
      }

      q = {
        id: `q_${card.id}_pp`,
        card,
        drillType: 'principal_parts',
        format,
        prompt: firstForm,
        promptSubtext: 'Provide remaining principal parts',
        questionLabel: 'Principal Parts Drill',
        correctAnswer: remainingParts,
        acceptableAnswers: [remainingParts],
        options,
        explanation: `Full forms: ${card.term} (${card.definition})`,
      };
    }

    if (q) questions.push(q);
  }

  // Limit question count if specified
  if (config.questionCount && config.questionCount > 0) {
    return questions.slice(0, config.questionCount);
  }

  return questions;
}
