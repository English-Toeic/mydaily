import type { Deck, Word } from "@/types/vocab";
import { SENTENCE_COUNT, toDrafts } from "@/lib/sentences";

const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** Bỏ dấu tiếng Việt và chuyển về chữ thường: "Đạt được" → "dat duoc" */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/đ/g, "d");
}

export function tokenize(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

export type Range = [start: number, end: number];

function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length <= 1) return ranges;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: Range[] = [sorted[0]];
  for (const [start, end] of sorted.slice(1)) {
    const last = merged[merged.length - 1];
    if (start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

/**
 * Tìm vị trí khớp trong chuỗi gốc (không phân biệt dấu).
 * Chuẩn hóa từng ký tự để ánh xạ được vị trí về chuỗi gốc.
 */
export function findMatchRanges(text: string, tokens: string[]): Range[] {
  if (!text || tokens.length === 0) return [];

  let normalized = "";
  const indexMap: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const piece = normalizeText(text[i]);
    for (let j = 0; j < piece.length; j++) {
      normalized += piece[j];
      indexMap.push(i);
    }
  }

  const ranges: Range[] = [];
  for (const token of tokens) {
    let from = 0;
    while (from <= normalized.length - token.length) {
      const idx = normalized.indexOf(token, from);
      if (idx === -1) break;
      ranges.push([indexMap[idx], indexMap[idx + token.length - 1] + 1]);
      from = idx + token.length;
    }
  }
  return mergeRanges(ranges);
}

// ---------------------------------------------------------------------------

export type SearchScope = "deck" | "all";
export type SentenceStatus = "all" | "missing" | "complete";

export interface WordHit {
  word: Word;
  deck: Deck;
  /** Câu luyện tập chứa từ khóa (khi từ khóa không nằm ở english/meaning/ipa). */
  sentenceHit: string | null;
}

export function sentenceCount(word: Word): number {
  return word.sentences?.length ?? 0;
}

function matchesStatus(word: Word, status: SentenceStatus): boolean {
  const n = sentenceCount(word);
  if (status === "missing") return n < SENTENCE_COUNT;
  if (status === "complete") return n >= SENTENCE_COUNT;
  return true;
}

function sentenceTexts(word: Word): string[] {
  return toDrafts(word.sentences ?? [])
    .filter((d) => d.vi.trim() || d.en.trim())
    .map((d) => [d.vi.trim(), d.en.trim()].filter(Boolean).join(" → "));
}

/** Điểm càng thấp thì càng xếp lên trên. */
function rankWord(word: Word, query: string): number {
  const en = normalizeText(word.english);
  if (en === query) return 0;
  if (en.startsWith(query)) return 1;
  if (en.includes(query)) return 2;
  if (normalizeText(word.meaning).includes(query)) return 3;
  return 4;
}

export function searchWords(
  decks: Deck[],
  tokens: string[],
  status: SentenceStatus
): WordHit[] {
  const hits: { hit: WordHit; rank: number }[] = [];
  const joinedQuery = tokens.join(" ");

  for (const deck of decks) {
    for (const word of deck.words) {
      if (!matchesStatus(word, status)) continue;

      if (tokens.length === 0) {
        hits.push({ hit: { word, deck, sentenceHit: null }, rank: 0 });
        continue;
      }

      const head = normalizeText(
        [word.english, word.meaning, word.ipa ?? ""].join(" ")
      );
      const sentences = sentenceTexts(word);
      const normalizedSentences = sentences.map(normalizeText);
      const haystack = `${head} ${normalizedSentences.join(" ")}`;

      if (!tokens.every((t) => haystack.includes(t))) continue;

      const headMatchesAll = tokens.every((t) => head.includes(t));
      const sentenceIdx = headMatchesAll
        ? -1
        : normalizedSentences.findIndex((s) => tokens.some((t) => s.includes(t)));

      hits.push({
        hit: {
          word,
          deck,
          sentenceHit: sentenceIdx >= 0 ? sentences[sentenceIdx] : null,
        },
        rank: rankWord(word, joinedQuery),
      });
    }
  }

  // Array.prototype.sort là stable nên thứ tự gốc được giữ khi cùng điểm
  return hits.sort((a, b) => a.rank - b.rank).map((h) => h.hit);
}