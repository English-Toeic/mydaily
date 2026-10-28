// src/lib/sentences.ts
import type { Sentence } from "@/types/vocab";
import { editDistance, lemma, toUS } from "./text-match";

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

// const CONTRACTIONS: Record<string, string> = {
//   "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are",
//   "he's": "he is", "she's": "she is", "it's": "it is", "that's": "that is",
//   "there's": "there is", "what's": "what is", "let's": "let us",
//   "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not",
//   "don't": "do not", "doesn't": "does not", "didn't": "did not",
//   "can't": "cannot", "couldn't": "could not", "won't": "will not",
//   "wouldn't": "would not", "shouldn't": "should not", "mustn't": "must not",
//   "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
//   "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have",
//   "i'll": "i will", "you'll": "you will", "he'll": "he will", "she'll": "she will",
//   "it'll": "it will", "we'll": "we will", "they'll": "they will",
//   "i'd": "i would", "you'd": "you would", "he'd": "he would", "she'd": "she would",
//   "we'd": "we would", "they'd": "they would",
// };

const FIXED_CONTRACTIONS: Record<string, string[]> = {
  "can't": ["can", "not"], cannot: ["can", "not"], "won't": ["will", "not"],
  "shan't": ["shall", "not"], "ain't": ["is", "not"], "let's": ["let", "us"],
};

/** Gặp các từ này phía sau thì 's = has, 'd = had */
const PERFECT_NEXT = new Set([
  "been", "got", "gotten", "gone", "had", "done", "seen", "made", "taken", "given",
  "eaten", "written", "known", "told", "said", "found", "lost", "left", "bought", "heard",
]);
const S_SUBJECTS = /^(?:he|she|it|that|there|here|what|who|where|when|how|why|this)$/;

/** Mở viết tắt theo ngữ cảnh: "he's been" → he has been, "I'd better" → I had better */
function expand(tok: string, next = ""): string[] {
  const fixed = FIXED_CONTRACTIONS[tok];
  if (fixed) return fixed;

  const nt = tok.match(/^(\p{L}+)n't$/u);
  if (nt) return [nt[1], "not"];

  const m = tok.match(/^(\p{L}+)'(m|re|ve|ll|d|s)$/u);
  if (!m) return [tok];
  const [, base, suf] = m;
  const perfect = PERFECT_NEXT.has(next);
  switch (suf) {
    case "m": return [base, "am"];
    case "re": return [base, "are"];
    case "ve": return [base, "have"];
    case "ll": return [base, "will"];
    case "d": return [base, perfect || next === "better" ? "had" : "would"];
    default: return S_SUBJECTS.test(base) ? [base, perfect ? "has" : "is"] : [tok]; // 's sở hữu giữ nguyên
  }
}

const NUMBERS: Record<string, string> = Object.fromEntries(
  "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty"
    .split(" ")
    .map((w, i) => [w, String(i)])
);

/** Chuẩn hóa câu thành mảng từ: chữ thường, mở rộng viết tắt, bỏ dấu câu */
export function normalize(s: string): string[] {
  const raw = s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^'+|'+$/g, ""))
    .filter(Boolean);

  const out: string[] = [];
  raw.forEach((tok, i) => {
    for (const t of expand(tok, raw[i + 1])) {
      const w = t.replace(/'/g, "");
      if (w) out.push(NUMBERS[w] ?? w);
    }
  });
  return out;
}

/** Hư từ: sai/thiếu thì phạt nhẹ hơn từ chính. Không có "not" vì phủ định đổi hẳn nghĩa */
const FUNCTION_WORDS = new Set([
  "a", "an", "the", "to", "of", "in", "on", "at", "for", "with", "by", "from", "into", "about",
  "is", "am", "are", "was", "were", "be", "been", "do", "does", "did", "will", "would",
  "shall", "should", "can", "could", "may", "might", "must", "have", "has", "had",
  "and", "or", "but", "so", "this", "that", "these", "those", "some", "any",
]);

const PLACEHOLDERS = new Set(["sb", "sth", "someone", "somebody", "something", "ones", "oneself"]);

/** Chi phí (nhân 10 để tránh sai số số thực) */
const COST = { full: 10, fn: 5, swap: 5, typo: 4, form: 3 } as const;

export type DiffKind = "ok" | "typo" | "form" | "minor" | "wrong" | "missing" | "extra" | "swap";
export interface DiffOp {
  kind: DiffKind;
  user?: string;   // từ người học gõ
  answer?: string; // từ trong đáp án
}

const isFn = (w: string) => FUNCTION_WORDS.has(w);
const indel = (w: string) => (isFn(w) ? COST.fn : COST.full);
const weight = (tokens: string[]) => tokens.reduce((s, t) => s + indel(t), 0);

function isTypo(x: string, y: string): boolean {
  if (Math.min(x.length, y.length) < 3) return false;
  const allowed = Math.max(x.length, y.length) >= 7 ? 2 : 1;
  return editDistance(x, y) <= allowed;
}

function sub(x: string, y: string): [number, DiffKind] {
  if (x === y || toUS(x) === toUS(y)) return [0, "ok"];
  if (lemma(x) === lemma(y)) return [COST.form, "form"];  // go/went, is/was, apple/apples
  if (isFn(x) && isFn(y)) return [COST.fn, "minor"];      // a/the, in/on
  if (isTypo(x, y)) return [COST.typo, "typo"];
  return [COST.full, "wrong"];
}

/** Căn chỉnh hai câu theo từ (có tính đảo vị trí), trả về chi phí và chỗ sai */
function align(u: string[], a: string[]): { cost: number; ops: DiffOp[] } {
  const n = u.length, m = a.length;
  const d = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) d[i][0] = d[i - 1][0] + indel(u[i - 1]);
  for (let j = 1; j <= m; j++) d[0][j] = d[0][j - 1] + indel(a[j - 1]);

  const swapped = (i: number, j: number) =>
    i > 1 && j > 1 && u[i - 1] === a[j - 2] && u[i - 2] === a[j - 1] && u[i - 1] !== u[i - 2];

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      let best = Math.min(
        d[i - 1][j] + indel(u[i - 1]),                 // thừa
        d[i][j - 1] + indel(a[j - 1]),                 // thiếu
        d[i - 1][j - 1] + sub(u[i - 1], a[j - 1])[0]   // thay
      );
      if (swapped(i, j)) best = Math.min(best, d[i - 2][j - 2] + COST.swap);
      d[i][j] = best;
    }
  }

  // Truy vết để biết sai ở đâu
  const ops: DiffOp[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const [c, kind] = sub(u[i - 1], a[j - 1]);
      if (d[i][j] === d[i - 1][j - 1] + c) {
        ops.push({ kind, user: u[i - 1], answer: a[j - 1] });
        i--; j--;
        continue;
      }
      if (swapped(i, j) && d[i][j] === d[i - 2][j - 2] + COST.swap) {
        ops.push(
          { kind: "swap", user: u[i - 1], answer: a[j - 1] },
          { kind: "swap", user: u[i - 2], answer: a[j - 2] }
        );
        i -= 2; j -= 2;
        continue;
      }
    }
    if (i > 0 && (j === 0 || d[i][j] === d[i - 1][j] + indel(u[i - 1]))) {
      ops.push({ kind: "extra", user: u[i - 1] });
      i--;
    } else {
      ops.push({ kind: "missing", answer: a[j - 1] });
      j--;
    }
  }
  return { cost: d[n][m], ops: ops.reverse() };
}

const sameWord = (x: string, y: string) => x === y || lemma(x) === lemma(y) || isTypo(x, y);

/** Người dùng thiếu từ đang học? Nhận cả dạng khác (went ~ go) và lỗi gõ nhẹ */
function missingTarget(user: string[], answer: string[], target: string): boolean {
  return normalize(target)
    .filter((t) => !PLACEHOLDERS.has(t) && answer.some((a) => sameWord(a, t)))
    .some((t) => !user.some((u) => sameWord(u, t)));
}

export type SentenceVerdict = "correct" | "almost" | "wrong";

export interface SentenceCheck {
  verdict: SentenceVerdict;
  best: string;       // đáp án gần nhất với câu người dùng
  similarity: number; // 0 → 1
  diff: DiffOp[];     // chỗ đúng/sai từng từ, để hiển thị
  targetMissing: boolean;
}

/** Lỗi nặng: sai hoặc thiếu/thừa một từ chính */
export const isMajor = (op: DiffOp) =>
  op.kind === "wrong" ||
  (op.kind === "missing" && !isFn(op.answer!)) ||
  (op.kind === "extra" && !isFn(op.user!));

export function checkSentence(input: string, answers: string[], targetWord: string): SentenceCheck {
  const user = normalize(input);
  let best: (SentenceCheck & { tokens: string[] }) | null = null;

  for (const ans of answers) {
    const tokens = normalize(ans);
    const { cost, ops } = align(user, tokens);
    const similarity = Math.max(0, 1 - cost / Math.max(weight(tokens), weight(user), 1));
    if (!best || similarity > best.similarity) {
      best = { verdict: "wrong", best: ans, similarity, diff: ops, tokens,  targetMissing: false };
    }
  }
  if (!best || !user.length) {
    return { verdict: "wrong", best: best?.best ?? "", similarity: 0, diff: best?.diff ?? [], targetMissing: true };
  }

  const { tokens, ...result } = best;
  if (result.diff.every((o) => o.kind === "ok")) {
    return { ...result, verdict: "correct", similarity: 1 };
  }

  const targetMissing = missingTarget(user, tokens, targetWord);
  const majors = result.diff.filter(isMajor).length;
  // Không có lỗi nặng: chỉ sai chính tả, dạng từ, mạo từ… thì cho qua.
  // Đúng 1 lỗi nặng: chỉ cho qua nếu câu đủ dài (vẫn giống ≥ 80%)
  const closeEnough = majors === 0 ? result.similarity >= 0.5 : majors === 1 && result.similarity >= 0.8;

  // if (closeEnough && !missingTarget(user, tokens, targetWord)) {
  //   return { ...result, verdict: "almost" };
  // }
  return { ...result, targetMissing, verdict: closeEnough && !targetMissing ? "almost" : "wrong" };
}

/** Gợi ý chữ cái đầu: "I usually get up early." → "I u______ g__ u_ e____." */
export function makeHint(answer: string): string {
  return answer
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[\p{L}\p{N}']+/gu, (m) => m[0] + "_".repeat(m.length - 1)))
    .join(" ");
}



