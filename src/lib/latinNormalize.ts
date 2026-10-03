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

export function generateVocabulaLink(term: string): string {
  const parts = term.split(',').map(p => p.trim());
  let query = parts[0];
  // Remove trailing info like " (minōris)"
  query = query.split(' ')[0];
  return `https://www.vocabula.lat/?q=${normalizeLatinSearch(query)}`;
}

export function generateLatinIsSimpleLink(term: string): string {
  const parts = term.split(',').map(p => p.trim());
  let query = parts[0];
  query = query.split(' ')[0];
  return `https://www.latin-is-simple.com/en/vocabulary/search/?q=${normalizeLatinSearch(query)}`;
}

export function generateCactusLink(term: string): string {
  const parts = term.split(',').map(p => p.trim());
  let query = parts[0];
  query = query.split(' ')[0];
  return `https://latin.cactus2000.de/showverb.en.php?verb=${normalizeLatinSearch(query)}&gen=0&voc=0`;
}
