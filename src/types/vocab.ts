// src/types/vocab.ts
export type WordStatus = "new" | "learning" | "learned";

export interface Word {
  id: number;
  deck_id: number;
  english: string;   // "prevent"
  meaning: string;   // "ngăn chặn"
  ipa: string | null;
  status: WordStatus;
  correct_count: number; // số lần đúng liên tiếp → đủ thì learned
  sentences: Sentence[];
}

export interface Deck {
  id: number;
  name: string;
  parent_id: number | null;
  words: Word[];
}

export type StudyDirection = "vi-en" | "en-vi"; // TV→EN | EN→TV

export interface DeckCount {
  new: number;
  learn: number;
  total: number; // learned
}

export interface Sentence {
  vi: string;     // "Tôi thường dậy sớm."
  en: string[];   // ["I usually get up early.", "I often get up early."]
}

export type WordFields = {
  english: string;
  meaning: string;
  ipa: string | null;
  sentences: Sentence[];
};