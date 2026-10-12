import { normalize } from "@/lib/utils";
import type { HintToken, Sentence } from "./types";

export const toPercent = (part: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;

/** Chỉ giữ id còn tồn tại trong bài, tránh đếm cả câu đã bị xoá */
export function getLearnedSet(sentences: Sentence[], learnedIds: number[]): Set<number> {
  const ids = new Set(learnedIds);
  return new Set(sentences.filter((s) => ids.has(s.id)).map((s) => s.id));
}

/**
 * Tìm index của câu chưa thuộc, bắt đầu từ `from` và quay vòng về đầu.
 * Trả về -1 nếu tất cả đã thuộc.
 */
export function findNextUnlearned(
  sentences: Sentence[],
  learned: Set<number>,
  from = 0
): number {
  const n = sentences.length;
  for (let k = 0; k < n; k++) {
    const i = (from + k) % n;
    if (!learned.has(sentences[i].id)) return i;
  }
  return -1;
}

/** Che chữ và số, giữ nguyên dấu câu để người học thấy cấu trúc câu */
const maskWord = (word: string) => word.replace(/[\p{L}\p{N}]/gu, "•");

/**
 * Hiện các từ người học gõ đúng liên tiếp từ đầu câu, mở thêm 1 từ kế tiếp,
 * phần còn lại bị che.
 */
export function buildHint(correct: string, input: string): HintToken[] {
  const words = correct.trim().split(/\s+/);

  const expected = normalize(correct).split(/\s+/);
  const typed = normalize(input).split(/\s+/).filter(Boolean);

  let matched = 0;

  while (
    matched < expected.length &&
    matched < typed.length &&
    expected[matched] === typed[matched]
  ) {
    matched++;
  }

  // Đếm số từ gốc đã khớp hoàn toàn
  let consumed = 0;
  let revealed = 0;

  for (const word of words) {
    const parts = normalize(word).split(/\s+/);

    if (consumed + parts.length <= matched) {
      consumed += parts.length;
      revealed++;
    } else {
      break;
    }
  }

  const reveal = Math.min(words.length, revealed + 1);

  return words.map((word, i) => ({
    text: i < reveal ? word : maskWord(word),
    hidden: i >= reveal,
  }));
}