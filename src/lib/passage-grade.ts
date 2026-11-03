import { editDistance, lemma, toUS } from "@/lib/text-match";

export type LineVerdict = "correct" | "almost" | "wrong";
export type DiffToken = { text: string; kind: "same" | "missing" | "extra" };

export interface LineGrade {
  verdict: LineVerdict;
  /** Đáp án gốc khớp nhất, dùng để hiển thị và đọc */
  best: string;
  note?: string;
  /** So sánh từng từ giữa câu người học và đáp án */
  diff: DiffToken[];
}

const CONTRACTIONS: [RegExp, string][] = [
  [/\bwon't\b/g, "will not"],
  [/\bcan't\b/g, "can not"],
  [/\bcannot\b/g, "can not"],
  [/\bshan't\b/g, "shall not"],
  [/\b(\w+)n't\b/g, "$1 not"],
  [/\bi'm\b/g, "i am"],
  [/\b(\w+)'re\b/g, "$1 are"],
  [/\b(\w+)'ve\b/g, "$1 have"],
  [/\b(\w+)'ll\b/g, "$1 will"],
  [/\b(\w+)'d\b/g, "$1 would"],
  [/\blet's\b/g, "let us"],
  [/\b(it|that|there|here|what|who|where|how|he|she)'s\b/g, "$1 is"],
];

export function normalizeSentence(s: string): string {
  let out = s.normalize("NFC").toLowerCase().replace(/[‘’`´]/g, "'");
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  return out
    .replace(/[^\p{L}\p{N}'\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const RANK: Record<LineVerdict, number> = { correct: 0, almost: 1, wrong: 2 };
const tokens = (s: string) => s.split(" ").filter(Boolean);
const mapWords = (s: string, f: (w: string) => string) => tokens(s).map(f).join(" ");
const letterCount = (s: string) => (s.match(/[\p{L}\p{N}]/gu) ?? []).length;
/** Câu càng dài thì càng cho phép sai nhiều ký tự, tối đa 6 */
const tolerance = (n: number) => (n <= 6 ? 0 : Math.min(6, Math.max(1, Math.round(n / 14))));

type Compared = { verdict: LineVerdict; note?: string; dist: number };

function compareOne(a: string, v: string): Compared {
  if (a === v || a.replace(/ /g, "") === v.replace(/ /g, "")) return { verdict: "correct", dist: 0 };
  if (mapWords(a, toUS) === mapWords(v, toUS)) {
    return { verdict: "correct", note: "Khác cách viết Anh-Anh / Anh-Mỹ", dist: 0 };
  }
  const dist = editDistance(a, v);
  if (mapWords(a, lemma) === mapWords(v, lemma)) {
    return { verdict: "almost", note: "Đúng câu nhưng có từ sai dạng (thì, số ít/nhiều…)", dist };
  }
  if (dist <= tolerance(letterCount(v))) return { verdict: "almost", note: "Sai chính tả nhẹ", dist };
  return { verdict: "wrong", dist };
}

export function gradeLine(input: string, answers: string[]): LineGrade {
  const list = answers.filter((x) => x.trim());
  const a = normalizeSentence(input);

  let best: Compared = { verdict: "wrong", dist: Infinity };
  let bestIdx = 0;
  if (a) {
    list.forEach((ans, i) => {
      const r = compareOne(a, normalizeSentence(ans));
      if (RANK[r.verdict] < RANK[best.verdict] || (r.verdict === best.verdict && r.dist < best.dist)) {
        best = r;
        bestIdx = i;
      }
    });
  }

  const answer = list[bestIdx] ?? "";
  return {
    verdict: best.verdict,
    note: best.note,
    best: answer,
    diff: wordDiff(a, normalizeSentence(answer)),
  };
}

/** Diff theo từ, dùng LCS */
export function wordDiff(input: string, answer: string): DiffToken[] {
  const a = tokens(input);
  const b = tokens(answer);
  const same = (x: string, y: string) => x === y || toUS(x) === toUS(y);

  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = same(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (same(a[i], b[j])) {
      out.push({ text: b[j], kind: "same" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ text: a[i++], kind: "extra" });
    } else {
      out.push({ text: b[j++], kind: "missing" });
    }
  }
  while (i < a.length) out.push({ text: a[i++], kind: "extra" });
  while (j < b.length) out.push({ text: b[j++], kind: "missing" });
  return out;
}