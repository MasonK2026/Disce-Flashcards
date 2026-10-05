export function normalizeLatinSearch(input: string): string {
  let s = input.toLowerCase();

  // Strip macrons: ā→a, ē→e, ī→i, ō→o, ū→u
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Normalize u/v: both map to the same canonical form (u is most common in old latin)
  s = s.replace(/v/g, 'u');

  // Normalize i/j: both map to the same canonical form
  s = s.replace(/j/g, 'i');

  return s;
}

export function toConsonantalVJ(text: string): string {
  let result = text;
  const VOWELS = "aeiouy";
  
  // 1. Initial i before a vowel -> j
  result = result.replace(new RegExp(`^i(?=[${VOWELS}])`), 'j');
  
  // 2. Intervocalic i -> j
  result = result.replace(new RegExp(`([${VOWELS}])i(?=[${VOWELS}])`, 'g'), '$1j');
  
  // 3. Initial u before a vowel -> v
  result = result.replace(new RegExp(`^u(?=[${VOWELS}])`), 'v');
  
  // 4. Intervocalic u -> v
  result = result.replace(new RegExp(`([${VOWELS}])u(?=[${VOWELS}])`, 'g'), '$1v');
  
  return result;
}

export function normalizeForCactusAndLIS(input: string): string {
  let s = input.toLowerCase();
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // strip macrons
  s = s.replace(/v/g, 'u');
  s = s.replace(/j/g, 'i');
  return toConsonantalVJ(s);
}

export function getVerbSecondPrincipalPart(term: string): string {
  const parts = term.split(',').map(p => p.trim());
  if (parts.length < 2) return parts[0].split(' ')[0];

  const part1 = parts[0].split(' ')[0];
  const part2 = parts[1].split(' ')[0];

  if (part2.startsWith('-')) {
    const ending = part2.substring(1);
    let stem = part1;

    if (stem.endsWith('ō') || stem.endsWith('o')) {
      if (stem.endsWith('eō') || stem.endsWith('eo') || stem.endsWith('iō') || stem.endsWith('io')) {
        stem = stem.slice(0, -2);
      } else {
        stem = stem.slice(0, -1);
      }
    } else if (stem.endsWith('or')) {
      if (stem.endsWith('eor') || stem.endsWith('ior')) {
        stem = stem.slice(0, -3);
      } else {
        stem = stem.slice(0, -2);
      }
    } else if (stem.endsWith('m')) {
      stem = stem.slice(0, -1);
    }

    return stem + ending;
  }

  return part2;
}

export function generateVocabulaLink(term: string): string {
  if (!term || !term.trim()) return 'https://www.vocabula.lat/';
  let query = term.trim();
  if (query.includes(',')) {
    query = query.split(',')[0].trim();
  }
  if (query.includes(' -')) {
    query = query.split(' -')[0].trim();
  }
  query = query.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  return `https://www.vocabula.lat/?q=${encodeURIComponent(normalizeLatinSearch(query))}`;
}

export function generateLatinIsSimpleLink(term: string): string {
  const parts = term.split(',').map(p => p.trim());
  let query = parts[0];
  query = query.split(' ')[0];
  return `https://www.latin-is-simple.com/en/vocabulary/search/?q=${normalizeForCactusAndLIS(query)}`;
}

export function generateCactusLink(term: string): string {
  let query = getVerbSecondPrincipalPart(term);
  return `https://latin.cactus2000.de/showverb.en.php?verb=${normalizeForCactusAndLIS(query)}&gen=0&voc=0`;
}
