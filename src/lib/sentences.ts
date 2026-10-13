// src/lib/sentences.ts
import type { Sentence } from "@/types/vocab";

export const SENTENCE_COUNT = 5;

/* =========================================================
   PHẦN 1: HỖ TRỢ FORM NHẬP LIỆU (Admin)
   ========================================================= */

/** Dạng dùng trong form: en là chuỗi thô, nhiều đáp án cách nhau bằng "|" */
export type SentenceDraft = { vi: string; en: string };

const blank = (): SentenceDraft => ({ vi: "", en: "" });

export const emptyDrafts = (): SentenceDraft[] =>
  Array.from({ length: SENTENCE_COUNT }, blank);

function padDrafts(drafts: SentenceDraft[]): SentenceDraft[] {
  const out = drafts.slice(0, SENTENCE_COUNT);
  while (out.length < SENTENCE_COUNT) out.push(blank());
  return out;
}

/** Sentence[] (từ DB) → drafts (cho form) */
export function toDrafts(sentences: Sentence[] | null | undefined): SentenceDraft[] {
  return padDrafts(
    (sentences ?? []).map((s) => ({ vi: s.vi, en: s.en.join(" | ") }))
  );
}

/** drafts (form) → Sentence[] (lưu DB). Bỏ qua dòng trống, báo lỗi dòng thiếu */
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

    if (!vi && en.length === 0) continue;
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

/** Dán nhanh, mỗi dòng: Câu tiếng Việt | English 1 | English 2 */
export function parsePaste(text: string): SentenceDraft[] {
  return padDrafts(
    text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [vi = "", ...en] = line.split(/\t|\|/).map((s) => s.trim());
        return { vi, en: en.filter(Boolean).join(" | ") };
      })
  );
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

/** Levenshtein tổng quát, cost thay thế tùy biến */
function levenshtein<T>(a: T[], b: T[], subCost: (x: T, y: T) => number): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,                               // xóa
        cur[j - 1] + 1,                            // thêm
        prev[j - 1] + subCost(a[i - 1], b[j - 1])  // thay
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/** 0 = giống, 0.5 = sai chính tả nhẹ, 1 = khác hẳn */
function tokenCost(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.min(a.length, b.length) < 3) return 1;
  const d = levenshtein([...a], [...b], (x, y) => (x === y ? 0 : 1));
  const allowed = Math.max(a.length, b.length) >= 7 ? 2 : 1;
  return d <= allowed ? 0.5 : 1;
}

const PLACEHOLDERS = new Set([
  "sb", "sth", "someone", "somebody", "something", "ones", "oneself",
]);
const stem = (w: string) => (w.length > 3 ? w.replace(/(e|y)$/, "") : w);
const hasToken = (tokens: string[], t: string) =>
  tokens.some((tok) => tok.startsWith(stem(t)));

/** Người dùng thiếu từ đang học? (chỉ xét các phần mà đáp án mẫu có chứa) */
function missingTarget(user: string[], answer: string[], target: string): boolean {
  return normalize(target)
    .filter((t) => !PLACEHOLDERS.has(t) && hasToken(answer, t))
    .some((t) => !hasToken(user, t));
}

export type SentenceVerdict = "correct" | "almost" | "wrong";

export interface SentenceCheck {
  verdict: SentenceVerdict;
  best: string;       // đáp án gần nhất với câu người dùng
  similarity: number; // 0 → 1
}

const ALMOST_THRESHOLD = 0.75;

export function checkSentence(
  input: string,
  answers: string[],
  targetWord: string
): SentenceCheck {
  const user = normalize(input);
  let best = answers[0] ?? "";
  let bestTokens = normalize(best);
  let bestSim = -1;

  for (const ans of answers) {
    const a = normalize(ans);
    if (a.join(" ") === user.join(" ")) {
      return { verdict: "correct", best: ans, similarity: 1 };
    }
    const dist = levenshtein(user, a, tokenCost);
    const sim = 1 - dist / Math.max(user.length, a.length, 1);
    if (sim > bestSim) {
      bestSim = sim;
      best = ans;
      bestTokens = a;
    }
  }

  const sim = Math.max(bestSim, 0);
  if (sim >= ALMOST_THRESHOLD && !missingTarget(user, bestTokens, targetWord)) {
    return { verdict: "almost", best, similarity: sim };
  }
  return { verdict: "wrong", best, similarity: sim };
}

/** Gợi ý chữ cái đầu: "I usually get up early." → "I u______ g__ u_ e____." */
export function makeHint(answer: string): string {
  return answer
    .split(/\s+/)
    .filter(Boolean)
    .map((w) =>
      w.replace(/[\p{L}\p{N}']+/gu, (m) => m[0] + "_".repeat(m.length - 1))
    )
    .join(" ");
}