export interface Card {
  id: string;
  term: string;
  definition: string;
  partOfSpeech?: string;
  grammar?: GrammarInfo;
  searchForms?: string[];
  vocabulaQuery?: string;
  source?: 'oxford' | 'whitakers' | 'manual';
}

export interface GrammarInfo {
  conjugation?: number;
  conjugationLabel?: string;
  isDeponent?: boolean;
  isIrregular?: boolean;
  declension?: number;
  declensionLabel?: string;
  gender?: string;
  genderLabel?: string;
  adjectiveType?: string;
}

export interface Category {
  display_name: string;
  cards: Card[];
}

export interface Chapter {
  chapter: string;
  chapter_title: string;
  categories: Record<string, Category>;
}

export interface UserData {
  settings: {
    theme: 'light' | 'dark';
    dailyGoal: number;
    defaultDirection: 'latin-to-english' | 'english-to-latin';
    showGrammarBadges: boolean;
    activeParts: number[];
  };
  progress: Record<string, ChapterProgress>;
  customDecks: Deck[];
  stats: {
    totalReviewed: number;
    streak: number;
    lastStudyDate: string;
    studyHistory: StudySession[];
  };
  customCards: Card[];
}

export interface ChapterProgress {
  completed: boolean;
  hidden: boolean;
  cards: Record<string, CardProgress>;
}

export interface CardProgress {
  memorized: boolean;
  favorite: boolean;
  srsBox: number;
  lastReview: string;
}

export interface Deck {
  id: string;
  name: string;
  cardIds: string[];
}

export interface StudySession {
  date: string;
  cardsReviewed: number;
  accuracy: number;
}
