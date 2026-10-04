import type { GrammarInfo } from '../types';
import { normalizeLatinSearch } from './latinNormalize';

export function parseGrammar(term: string, categorySlug: string = ''): { pos: string; grammar: GrammarInfo } {
  const normTerm = normalizeLatinSearch(term);
  const parts = term.split(',').map(p => p.trim());
  const normParts = normTerm.split(',').map(p => p.trim());
  const grammar: GrammarInfo = {};

  const slug = categorySlug.toLowerCase();
  const isVerbCategory = slug.startsWith('verb');
  const isNounCategory = slug.startsWith('noun');
  const isAdjCategory = slug.startsWith('adj');

  // The category in the source JSON is authoritative for the non-inflected /
  // closed-class parts of speech. Decide these immediately so the text
  // heuristics below (which look for things like "n." or "re" inside the term)
  // can never reclassify them as verbs or nouns.
  const categoryPos = slug.startsWith('pron') ? 'pronoun'
    : slug.startsWith('adv') ? 'adverb'
    : slug.startsWith('prep') ? 'preposition'
    : slug.startsWith('con') ? 'conjunction'
    : null;
  if (categoryPos) {
    return { pos: categoryPos, grammar };
  }

  // Tokenize into words for exact token matching
  const words = normTerm.split(/[\s,()+\.]+/).filter(Boolean);

  // --- VERB DETECTION ---
  if (isVerbCategory || (!isNounCategory && !isAdjCategory && (term.includes('re') || term.includes('rī') || term.includes('sum')))) {
    const p1 = normParts[0] || '';
    let rawP2 = parts[1] ? parts[1].replace(/^-/, '').trim() : '';
    // Strip qualifiers like "+ dat.", "(minōris)", "+ abl."
    rawP2 = rawP2.replace(/\+.*$/, '').replace(/\(.*?\)/g, '').trim();
    const normP2 = normalizeLatinSearch(rawP2).replace(/\+.*$/, '').trim();

    // 1. Defectives (exact word match)
    if (
      words.includes('inquit') ||
      words.includes('coepi') ||
      words.includes('coepisse') ||
      words.includes('memini') ||
      words.includes('meminisse') ||
      (words.includes('odi') && !words.includes('prodidi'))
    ) {
      grammar.isIrregular = true;
      grammar.conjugationLabel = 'Defective / Irreg.';
      return { pos: 'verb', grammar };
    }

    // 2. Phrases / Reflexives
    if (p1 === 'me' || p1.startsWith('me ')) {
      if (normTerm.includes('gero')) {
        grammar.conjugation = 3;
        grammar.conjugationLabel = '3rd Conj.';
        return { pos: 'verb', grammar };
      }
      if (normTerm.includes('praebeo')) {
        grammar.conjugation = 2;
        grammar.conjugationLabel = '2nd Conj.';
        return { pos: 'verb', grammar };
      }
      if (normTerm.includes('refero')) {
        grammar.isIrregular = true;
        grammar.conjugationLabel = 'Irregular (ferre)';
        return { pos: 'verb', grammar };
      }
      return { pos: 'verb', grammar };
    }

    if (normTerm.includes('certiorem facio')) {
      grammar.conjugation = 3;
      grammar.conjugationLabel = '3rd-io Conj.';
      return { pos: 'verb', grammar };
    }

    if (words.includes('noli') || words.includes('nolite')) {
      grammar.isIrregular = true;
      grammar.conjugationLabel = 'Irregular (nōlō)';
      return { pos: 'verb', grammar };
    }

    // 3. True irregular infinitives (esse, ferre, ire, velle, fieri)
    if (normP2 === 'esse' || normP2.endsWith('esse') || normP2 === 'posse') {
      grammar.isIrregular = true;
      grammar.conjugationLabel = 'Irregular (esse)';
      return { pos: 'verb', grammar };
    }
    if (normP2 === 'ferre' || normP2.endsWith('ferre')) {
      grammar.isIrregular = true;
      grammar.conjugationLabel = 'Irregular (ferre)';
      return { pos: 'verb', grammar };
    }
    if (normP2 === 'uelle' || normP2 === 'velle' || normP2 === 'nolle' || normP2 === 'malle') {
      grammar.isIrregular = true;
      grammar.conjugationLabel = 'Irregular (volō)';
      return { pos: 'verb', grammar };
    }
    if (normP2 === 'fieri' || normP2 === 'fieri') {
      grammar.isIrregular = true;
      grammar.conjugationLabel = 'Irregular (fīō)';
      return { pos: 'verb', grammar };
    }
    if (
      (normP2 === 'ire' || normP2.endsWith('ire')) &&
      (words.includes('eo') || p1.endsWith('eo') || words.includes('it') || words.includes('exit') || words.includes('redit'))
    ) {
      grammar.isIrregular = true;
      grammar.conjugationLabel = 'Irregular (eō)';
      return { pos: 'verb', grammar };
    }
    if (p1 === 'do' && (normP2 === 'dare' || rawP2 === 'dare')) {
      grammar.isIrregular = true;
      grammar.conjugationLabel = 'Irregular (dō)';
      return { pos: 'verb', grammar };
    }
    if (
      p1 === 'sum' ||
      p1 === 'est' ||
      p1 === 'adsum' ||
      p1 === 'absum' ||
      p1 === 'praesum' ||
      p1 === 'supersum' ||
      p1 === 'possum'
    ) {
      grammar.isIrregular = true;
      grammar.conjugationLabel = 'Irregular';
      return { pos: 'verb', grammar };
    }

    // 4. Deponent Verbs
    if (rawP2.endsWith('ārī') || (!rawP2.includes('ā') && normP2.endsWith('ari'))) {
      grammar.isDeponent = true;
      grammar.conjugation = 1;
      grammar.conjugationLabel = '1st Deponent';
      return { pos: 'verb', grammar };
    }
    if (rawP2.endsWith('ērī') || normP2.endsWith('eri')) {
      grammar.isDeponent = true;
      grammar.conjugation = 2;
      grammar.conjugationLabel = '2nd Deponent';
      return { pos: 'verb', grammar };
    }
    if (rawP2.endsWith('īrī') || normP2.endsWith('iri')) {
      grammar.isDeponent = true;
      grammar.conjugation = 4;
      grammar.conjugationLabel = '4th Deponent';
      return { pos: 'verb', grammar };
    }
    if (rawP2.endsWith('ī') || normP2.endsWith('i')) {
      grammar.isDeponent = true;
      if (p1.endsWith('ior')) {
        grammar.conjugation = 3;
        grammar.conjugationLabel = '3rd-io Deponent';
      } else {
        grammar.conjugation = 3;
        grammar.conjugationLabel = '3rd Deponent';
      }
      return { pos: 'verb', grammar };
    }

    // 5. Standard regular conjugations (1st, 2nd, 3rd, 4th)
    if (rawP2.endsWith('āre') || rawP2.endsWith('are')) {
      grammar.conjugation = 1;
      grammar.conjugationLabel = '1st Conj.';
      return { pos: 'verb', grammar };
    }
    if (rawP2.endsWith('ēre') || (rawP2.includes('ē') && normP2.endsWith('ere'))) {
      grammar.conjugation = 2;
      grammar.conjugationLabel = '2nd Conj.';
      return { pos: 'verb', grammar };
    }
    if (rawP2.endsWith('īre') || normP2.endsWith('ire')) {
      grammar.conjugation = 4;
      grammar.conjugationLabel = '4th Conj.';
      return { pos: 'verb', grammar };
    }
    if (rawP2.endsWith('ere') || normP2.endsWith('ere')) {
      if (p1.endsWith('io')) {
        grammar.conjugation = 3;
        grammar.conjugationLabel = '3rd-io Conj.';
      } else {
        grammar.conjugation = 3;
        grammar.conjugationLabel = '3rd Conj.';
      }
      return { pos: 'verb', grammar };
    }

    // Special single-word imperatives or 3rd persons
    if (term.includes('scītō') || term.includes('scito')) {
      grammar.conjugation = 4;
      grammar.conjugationLabel = '4th Conj.';
      return { pos: 'verb', grammar };
    }
    if (p1.endsWith('at')) {
      grammar.conjugation = 1;
      grammar.conjugationLabel = '1st Conj.';
      return { pos: 'verb', grammar };
    }
    if (p1.endsWith('et')) {
      grammar.conjugation = 2;
      grammar.conjugationLabel = '2nd Conj.';
      return { pos: 'verb', grammar };
    }
    if (p1.endsWith('it')) {
      grammar.conjugation = 3;
      grammar.conjugationLabel = '3rd Conj.';
      return { pos: 'verb', grammar };
    }

    if (isVerbCategory) {
      return { pos: 'verb', grammar };
    }
  }

  // --- NOUN DETECTION ---
  if (isNounCategory || parts.some(p => p.includes('m.') || p.includes('f.') || p.includes('n.'))) {
    // Gender detection
    if (term.includes('m. pl.')) { grammar.gender = 'm. pl.'; grammar.genderLabel = 'masc. pl.'; }
    else if (term.includes('f. pl.')) { grammar.gender = 'f. pl.'; grammar.genderLabel = 'fem. pl.'; }
    else if (term.includes('n. pl.')) { grammar.gender = 'n. pl.'; grammar.genderLabel = 'neut. pl.'; }
    else if (term.includes('m.') || term.includes(' m')) { grammar.gender = 'm.'; grammar.genderLabel = 'masculine'; }
    else if (term.includes('f.') || term.includes(' f')) { grammar.gender = 'f.'; grammar.genderLabel = 'feminine'; }
    else if (term.includes('n.') || term.includes(' n')) { grammar.gender = 'n.'; grammar.genderLabel = 'neuter'; }

    // Declension detection from genitive (parts[1])
    if (parts.length >= 2) {
      const gen = parts[1].replace(/^-/, '').trim();
      const normGen = normParts[1].replace(/^-/, '').trim();

      if (gen.endsWith('ae') || gen.endsWith('ārum')) {
        grammar.declension = 1;
        grammar.declensionLabel = '1st Decl.';
      } else if (gen.endsWith('ī') || gen.endsWith('i') || gen.endsWith('ōrum') || gen.endsWith('orum')) {
        grammar.declension = 2;
        grammar.declensionLabel = '2nd Decl.';
      } else if (normGen.endsWith('is') || normGen.endsWith('um') || normGen.endsWith('ium')) {
        grammar.declension = 3;
        grammar.declensionLabel = '3rd Decl.';
      } else if (gen.endsWith('ūs') || gen.endsWith('us') || gen.endsWith('uum')) {
        grammar.declension = 4;
        grammar.declensionLabel = '4th Decl.';
      } else if (gen.endsWith('ēī') || gen.endsWith('eī') || gen.endsWith('ei') || gen.endsWith('ērum')) {
        grammar.declension = 5;
        grammar.declensionLabel = '5th Decl.';
      }
    }

    return { pos: 'noun', grammar };
  }

  // --- ADJECTIVE DETECTION ---
  if (isAdjCategory || term.includes('-a, -um') || term.includes('-a -um') || term.includes('us, -a, -um') || term.includes('is, -e') || term.includes('is, e')) {
    if (term.includes('indeclinable')) {
      grammar.adjectiveType = 'Indeclinable';
    } else if (
      term.includes('-a, -um') || term.includes('-a -um') ||
      term.includes('-ae, -a') || term.includes('us, -a, -um') ||
      term.includes('alius, alia, aliud') || term.includes('aliī') ||
      (parts.length >= 3 && (parts[1].endsWith('a') || parts[1].endsWith('ā') || parts[1].endsWith('ae')) && (parts[2].endsWith('um') || parts[2].endsWith('ud') || parts[2].endsWith('a')))
    ) {
      grammar.adjectiveType = '1st/2nd Decl.';
    } else {
      grammar.adjectiveType = '3rd Decl.';
    }
    return { pos: 'adjective', grammar };
  }

  // Fallback part of speech from category slug
  let fallbackPos = 'other';
  if (categorySlug.includes('adv')) fallbackPos = 'adverb';
  else if (categorySlug.includes('prep')) fallbackPos = 'preposition';
  else if (categorySlug.includes('conj')) fallbackPos = 'conjunction';
  else if (categorySlug.includes('pronoun')) fallbackPos = 'pronoun';

  return { pos: fallbackPos, grammar };
}
