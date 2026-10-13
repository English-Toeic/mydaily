export interface ErrorRange {
  /** Vị trí bắt đầu của từ sai (trong chuỗi input gốc) */
  start: number;
  /** Vị trí kết thúc của từ sai */
  end: number;
  /** Vị trí ký tự lệch đầu tiên (đặt con trỏ ở đây) */
  caret: number;
}

interface Token {
  start: number;
  end: number;
  /** Ký tự đã chuẩn hóa, kèm vị trí trong chuỗi gốc */
  chars: { c: string; i: number }[];
  text: string;
}

// Dấu câu và ký hiệu: , . ? ! " ' … bị bỏ qua khi so sánh
const PUNCT = /[\p{P}\p{S}]/u;

function tokenize(s: string): Token[] {
  const tokens: Token[] = [];
  for (const m of s.matchAll(/\S+/g)) {
    const start = m.index ?? 0;
    const chars: Token["chars"] = [];
    for (let k = 0; k < m[0].length; k++) {
      const raw = m[0][k];
      if (PUNCT.test(raw)) continue;
      chars.push({ c: raw.toLowerCase(), i: start + k });
    }
    if (chars.length === 0) continue; // token chỉ toàn dấu câu
    tokens.push({
      start,
      end: start + m[0].length,
      chars,
      text: chars.map((x) => x.c).join(""),
    });
  }
  return tokens;
}

function compare(
  input: Token[],
  answer: string[],
  inputLength: number
): { score: number; range: ErrorRange | null } {
  let score = 0;

  for (let k = 0; k < input.length; k++) {
    const tok = input[k];
    const ans = answer[k];

    // Gõ thừa từ so với đáp án
    if (ans === undefined) {
      return { score, range: { start: tok.start, end: tok.end, caret: tok.start } };
    }

    if (tok.text === ans) {
      score += ans.length + 1;
      continue;
    }

    // Tìm ký tự lệch đầu tiên trong từ
    let p = 0;
    while (p < tok.chars.length && p < ans.length && tok.chars[p].c === ans[p]) p++;
    score += p;

    const caret =
      p < tok.chars.length
        ? tok.chars[p].i            // "teh" vs "the" → con trỏ trước "e"
        : tok.chars[p - 1].i + 1;   // "se" vs "see" → con trỏ ngay sau "se"

    return { score, range: { start: tok.start, end: tok.end, caret } };
  }

  // Đúng hết nhưng còn thiếu phần cuối → con trỏ ở cuối
  if (input.length < answer.length) {
    return { score, range: { start: inputLength, end: inputLength, caret: inputLength } };
  }

  return { score, range: null }; // khớp hoàn toàn
}

/**
 * Tìm chỗ sai đầu tiên của `input` so với các đáp án.
 * Trả về null nếu khớp hoàn toàn với ít nhất một đáp án.
 */
export function findFirstError(input: string, answers: string[]): ErrorRange | null {
  const inTokens = tokenize(input);
  let best: { score: number; range: ErrorRange | null } | null = null;

  for (const answer of answers) {
    const ansTokens = tokenize(answer).map((t) => t.text);
    const result = compare(inTokens, ansTokens, input.length);
    if (!result.range) return null;
    if (!best || result.score > best.score) best = result;
  }
  return best?.range ?? null;
}