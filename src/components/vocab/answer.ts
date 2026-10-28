import { editDistance, lemma, stripDiacritics, toUS, typoTolerance } from "@/lib/text-match";

export type Verdict = "correct" | "almost" | "wrong";
export type Lang = "en" | "vi";

export type AnswerCheck = {
  verdict: Verdict;
  /** Giải thích ngắn cho người học: sai dấu, sai dạng từ… */
  note?: string;
  /** Nghĩa khớp nhất */
  matched?: string;
};

// Giữ lại để file khác vẫn import được
export { stripDiacritics };
export const levenshtein = editDistance;

const PUNCT = /[.,!?;:"“”«»[\]{}…]/g;
const POS_TAG = /\((?:n|v|adj|adv|prep|conj|pron|det|phr\.?\s?v|idiom|inf|formal|informal)\.?\)/gi;
const EN_PLACEHOLDER = /\b(?:sb|sth|someone|somebody|something|one's|oneself)\b/g;
/** Tiền tố danh từ hoá / trạng từ, bỏ đi vẫn giữ nghĩa: "sự phát triển" ≈ "phát triển" */
const VI_PREFIX = /^(?:sự|việc|cuộc|cái|con|chiếc|nỗi|niềm|một cách|bị|được)\s+/;

/** Chuẩn hoá để so sánh: chữ thường, bỏ dấu câu, bỏ ghi chú "(n)", "(v)"… */
export function normalize(s: string, lang: Lang): string {
  let out = s
    .normalize("NFC")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[‘’`´]/g, "'")
    .replace(PUNCT, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (lang === "en") {
    // "look after sb" ≈ "look after", nhưng đáp án là chính "something" thì giữ nguyên
    const noPlaceholder = out.replace(EN_PLACEHOLDER, " ").replace(/\s+/g, " ").trim();
    if (noPlaceholder) out = noPlaceholder;
    // "to run" ≈ "run", "an apple" ≈ "apple"
    let prev: string;
    do {
      prev = out;
      out = out.replace(/^(?:to|a|an|the) /, "");
    } while (out !== prev);
  }
  return out;
}

/**
 * Một đáp án có thể chứa nhiều nghĩa: "chạy, chạy bộ; điều hành".
 * Phần trong ngoặc là tuỳ chọn: "(be) interested in" chấp nhận cả có và không có "be".
 */
export function answerVariants(answer: string, lang: Lang): string[] {
  const base = answer.replace(POS_TAG, " ");
  const sources = [base.replace(/\(.*?\)/g, " "), base.replace(/[()]/g, " ")];
  const parts = sources.flatMap((s) => [s, ...s.split(/[,;/|]/)]);
  return [...new Set(parts.map((p) => normalize(p, lang)).filter(Boolean))];
}

const RANK: Record<Verdict, number> = { correct: 0, almost: 1, wrong: 2 };
const mapWords = (s: string, f: (w: string) => string) => s.split(" ").map(f).join(" ");
const stripViPrefix = (s: string) => s.replace(VI_PREFIX, "");

function compare(a: string, v: string, lang: Lang): AnswerCheck {
  const hit = (verdict: Verdict, note?: string): AnswerCheck => ({ verdict, note, matched: v });

  if (lang === "en") {
    if (a.replace(/ /g, "") === v.replace(/ /g, "")) return hit("correct");
    if (mapWords(a, toUS) === mapWords(v, toUS)) {
      return hit("correct", `Khác cách viết Anh-Anh / Anh-Mỹ ("${v}")`);
    }
    if (mapWords(a, lemma) === mapWords(v, lemma)) {
      return hit("almost", `Đúng từ nhưng khác dạng, đáp án là "${v}"`);
    }
  } else {
    if (stripDiacritics(a) === stripDiacritics(v)) return hit("almost", "Sai hoặc thiếu dấu");
    const pa = stripViPrefix(a);
    const pv = stripViPrefix(v);
    if (pa === pv) return hit("correct", `Đầy đủ: "${v}"`);
    if (stripDiacritics(pa) === stripDiacritics(pv)) return hit("almost", "Sai hoặc thiếu dấu");
  }

  const tol = typoTolerance(letterCount(v));
  const [x, y] = lang === "vi" ? [stripDiacritics(a), stripDiacritics(v)] : [a, v];
  if (tol && editDistance(x, y) <= tol) return hit("almost", `Sai chính tả nhẹ, đáp án là "${v}"`);

  return hit("wrong");
}

function matchOne(a: string, variants: string[], lang: Lang): AnswerCheck {
  let best: AnswerCheck = { verdict: "wrong", matched: variants[0] };
  for (const v of variants) {
    if (a === v) return { verdict: "correct", matched: v };
    const r = compare(a, v, lang);
    if (RANK[r.verdict] < RANK[best.verdict]) best = r;
  }
  return best;
}

/** Bản chấm chi tiết, có kèm lời giải thích */
export function gradeAnswer(input: string, answer: string, lang: Lang): AnswerCheck {
  const a = normalize(input, lang);
  if (!a) return { verdict: "wrong" };

  const variants = answerVariants(answer, lang);
  const whole = matchOne(a, variants, lang);
  if (whole.verdict === "correct") return whole;

  // Người học gõ nhiều nghĩa "chạy, điều hành": nghĩa nào cũng phải đúng (chống đoán bừa)
  const parts = input.split(/[,;/]/).map((p) => normalize(p, lang)).filter(Boolean);
  if (parts.length > 1) {
    const results = parts.map((p) => matchOne(p, variants, lang));
    if (results.every((r) => r.verdict !== "wrong")) {
      const merged = results.find((r) => r.verdict === "almost") ?? results[0];
      if (RANK[merged.verdict] < RANK[whole.verdict]) return merged;
    }
  }
  return whole;
}

/** Giữ API cũ */
export const checkAnswer = (input: string, answer: string, lang: Lang): Verdict =>
  gradeAnswer(input, answer, lang).verdict;

/** Đáp án chính dùng để gợi ý: nghĩa đầu tiên, bỏ ghi chú trong ngoặc */
export const hintTargetOf = (answer: string) =>
  answer.replace(/\(.*?\)/g, "").split(/[,;/|]/)[0].trim();

export const letterCount = (s: string) => (s.match(/[\p{L}\p{N}]/gu) ?? []).length;

/** Tách thành từng từ, mỗi chữ cái chưa mở là null */
export function hintWords(target: string, revealed: number): (string | null)[][] {
  let shown = 0;
  return target
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      Array.from(word).map((ch) => {
        if (!/[\p{L}\p{N}]/u.test(ch)) return ch;
        return shown++ < revealed ? ch : null;
      })
    );
}