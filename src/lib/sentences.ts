// src/lib/sentences.ts
import type { Sentence } from "@/types/vocab";

export const SENTENCE_COUNT = 5;

/* =========================================================
   PHẦN 1: HỖ TRỢ FORM NHẬP LIỆU
   ========================================================= */

/** Dạng dùng trong form: en là chuỗi thô, nhiều đáp án cách nhau bằng "|" */
export type SentenceDraft = { vi: string; en: string };

export const emptyDrafts = (): SentenceDraft[] =>
  Array.from({ length: SENTENCE_COUNT }, () => ({ vi: "", en: "" }));

/** Sentence[] (từ DB) → drafts (cho form) */
export function toDrafts(sentences: Sentence[] | null | undefined): SentenceDraft[] {
  const drafts = (sentences ?? []).map((s) => ({
    vi: s.vi,
    en: s.en.join(" | "),
  }));
  while (drafts.length < SENTENCE_COUNT) drafts.push({ vi: "", en: "" });
  return drafts.slice(0, SENTENCE_COUNT);
}

/** drafts (form) → Sentence[] (lưu DB). Bỏ qua dòng trống, báo lỗi dòng thiếu. */
export function parseDrafts(drafts: SentenceDraft[]): {
  sentences: Sentence[];
  error?: string;
} {
  const sentences: Sentence[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const vi = drafts[i].vi.trim();
    const en = drafts[i].en
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!vi && en.length === 0) continue; // dòng trống → bỏ qua
    if (!vi || en.length === 0) {
      return {
        sentences: [],
        error: `Câu ${i + 1}: cần nhập cả tiếng Việt và tiếng Anh`,
      };
    }
    sentences.push({ vi, en });
  }
  return { sentences };
}

/**
 * Dán nhanh, mỗi dòng 1 câu:
 *   Câu tiếng Việt | English 1 | English 2
 */
export function parsePaste(text: string): SentenceDraft[] {
  const drafts = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [vi, ...en] = line.split(/\t|\|/).map((s) => s.trim());
      return { vi: vi ?? "", en: en.filter(Boolean).join(" | ") };
    });
  while (drafts.length < SENTENCE_COUNT) drafts.push({ vi: "", en: "" });
  return drafts.slice(0, SENTENCE_COUNT);
}

/* =========================================================
   PHẦN 2: CHẤM CÂU
   ========================================================= */

const CONTRACTIONS: Record<string, string> = {
  "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are",
  "he's": "he is", "she's": "she is", "it's": "it is", "that's": "that is",
  "there's": "there is", "what's": "what is", "let's": "let us",
  "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not",
  "don't": "do not", "doesn't": "does not", "didn't": "did not",
  "can't": "cannot", "couldn't": "could not", "won't": "will not",
  "wouldn't": "would not", "shouldn't": "should not", "mustn't": "must not",
  "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
  "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have",
  "i'll": "i will", "you'll": "you will", "he'll": "he will", "she'll": "she will",
  "it'll": "it will", "we'll": "we will", "they'll": "they will",
  "i'd": "i would", "you'd": "you would", "he'd": "he would", "she'd": "she would",
  "we'd": "we would", "they'd": "they would",
};

/** Chuẩn hóa câu thành mảng từ: chữ thường, mở rộng viết tắt, bỏ dấu câu */
export function normalize(s: string): string[] {
  let t = s.toLowerCase().replace(/[’‘`´]/g, "'");
  t = t.replace(/\bcan not\b/g, "cannot");
  t = t.replace(/[^\p{L}\p{N}'\s]/gu, " ");
  return t
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((tok) => (CONTRACTIONS[tok] ?? tok).split(" "))
    .map((tok) => tok.replace(/'/g, ""))
    .filter(Boolean);
}

/** Khoảng cách chỉnh sửa tính theo TỪ (không theo ký tự) */
function editDistance(a: string[], b: string[]): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

const PLACEHOLDERS = new Set([
  "sb", "sth", "smb", "smth", "st", "someone", "something", "ones", "oneself",
]);

/** Người dùng có dùng từ đang học không (chấp nhận biến thể: prevent → prevented) */
function containsTarget(userTokens: string[], english: string): boolean {
  const target = normalize(english.replace(/\(.*?\)/g, "")).filter(
    (t) => !PLACEHOLDERS.has(t)
  );
  const stem = (w: string) => (w.length > 3 ? w.replace(/(e|y)$/, "") : w);
  return target.every((t) => userTokens.some((tok) => tok.startsWith(stem(t))));
}

export type Verdict = "correct" | "close" | "wrong";
export interface CheckResult {
  verdict: Verdict;
  best: string;       // đáp án gần nhất với câu người dùng
  similarity: number; // 0 → 1
}

const CLOSE_THRESHOLD = 0.75;

export function checkSentence(
  input: string,
  answers: string[],
  targetWord: string
): CheckResult {
  const user = normalize(input);
  let best = answers[0] ?? "";
  let bestSim = -1;

  for (const ans of answers) {
    const a = normalize(ans);
    if (a.join(" ") === user.join(" ")) {
      return { verdict: "correct", best: ans, similarity: 1 };
    }
    const sim = 1 - editDistance(user, a) / Math.max(user.length, a.length, 1);
    if (sim > bestSim) {
      bestSim = sim;
      best = ans;
    }
  }

  if (bestSim >= CLOSE_THRESHOLD && containsTarget(user, targetWord)) {
    return { verdict: "close", best, similarity: bestSim };
  }
  return { verdict: "wrong", best, similarity: Math.max(bestSim, 0) };
}

/** Gợi ý chữ cái đầu: "I usually get up early." → "I u______ g__ u_ e____" */
export function makeHint(answer: string): string {
  return answer
    .replace(/[.,!?;:]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0] + "_".repeat(Math.max(0, w.length - 1)))
    .join(" ");
}

export type SentenceVerdict = "correct" | "almost" | "wrong";