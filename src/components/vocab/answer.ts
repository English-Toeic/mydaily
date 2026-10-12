export type Verdict = "correct" | "almost" | "wrong";
type Lang = "en" | "vi";

const PUNCT = /[.,!?;:"“”«»[\]{}…]/g;

/** Chuẩn hoá để so sánh: chữ thường, bỏ dấu câu, bỏ ghi chú "(n)", "(v)"… */
export function normalize(s: string, lang: Lang): string {
  let out = s
    .normalize("NFC")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[‘’`]/g, "'")
    .replace(PUNCT, " ")
    .replace(/\s+/g, " ")
    .trim();
  // "to run" ≈ "run" (chỉ áp dụng tiếng Anh, vì "to" trong tiếng Việt là "to lớn")
  if (lang === "en") out = out.replace(/^to /, "");
  return out;
}

/** Một đáp án có thể chứa nhiều nghĩa: "chạy, chạy bộ; điều hành" */
export function answerVariants(answer: string, lang: Lang): string[] {
  const cleaned = answer.replace(/\(.*?\)/g, " ");
  const parts = [cleaned, ...cleaned.split(/[,;/|]/)];
  return [...new Set(parts.map((p) => normalize(p, lang)).filter(Boolean))];
}

export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
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

/**
 * correct: khớp hoàn toàn với một trong các nghĩa
 * almost:  chỉ sai dấu tiếng Việt hoặc gõ nhầm 1–2 ký tự (vẫn tính là qua)
 * wrong:   còn lại
 */
export function checkAnswer(input: string, answer: string, lang: Lang): Verdict {
  const a = normalize(input, lang);
  if (!a) return "wrong";

  const variants = answerVariants(answer, lang);
  if (variants.includes(a)) return "correct";

  const bare = stripDiacritics(a);
  for (const v of variants) {
    if (stripDiacritics(v) === bare) return "almost";
    // Từ ngắn (< 4 ký tự) không cho sai, tránh "bad" lọt thành "bat"
    const tolerance = v.length >= 8 ? 2 : v.length >= 4 ? 1 : 0;
    if (tolerance && levenshtein(a, v) <= tolerance) return "almost";
  }
  return "wrong";
}

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
        if (!/[\p{L}\p{N}]/u.test(ch)) return ch; // giữ nguyên dấu gạch nối, nháy…
        return shown++ < revealed ? ch : null;
      })
    );
}