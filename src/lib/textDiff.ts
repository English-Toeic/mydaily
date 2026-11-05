export type DiffToken = { kind: "ok" | "miss" | "extra"; text: string };

export interface TextGrade {
  /** ok: khớp, miss: thiếu so với đáp án, extra: thừa hoặc sai */
  tokens: DiffToken[];
  /** Số từ khớp */
  matched: number;
  /** max(số từ đáp án, số từ đã nhập), để gõ thừa cũng bị trừ điểm */
  total: number;
  pct: number;
  exact: boolean;
}

const norm = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const tokenize = (s: string) =>
  s
    .split(/[\s\-–—/]+/)
    .map((raw) => ({ raw, key: norm(raw) }))
    .filter((t) => t.key);

export function gradeText(expected: string, typed: string): TextGrade {
  const a = tokenize(expected);
  const b = tokenize(typed);
  const n = a.length;
  const m = b.length;

  // dp[i][j] = LCS của a[i..] và b[j..]
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i].key === b[j].key ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].key === b[j].key) {
      tokens.push({ kind: "ok", text: b[j].raw });
      i++;
      j++;
    } else if (dp[i][j + 1] >= dp[i + 1][j]) {
      // Ưu tiên hiện từ gõ sai trước, rồi đến từ đúng: "~~hause~~ house"
      tokens.push({ kind: "extra", text: b[j++].raw });
    } else {
      tokens.push({ kind: "miss", text: a[i++].raw });
    }
  }
  while (i < n) tokens.push({ kind: "miss", text: a[i++].raw });
  while (j < m) tokens.push({ kind: "extra", text: b[j++].raw });

  const matched = dp[0][0];
  const total = Math.max(n, m);
  return {
    tokens,
    matched,
    total,
    pct: total ? Math.round((matched / total) * 100) : 100,
    exact: matched === n && m === n,
  };
}

export function sumGrades(grades: TextGrade[]) {
  let matched = 0;
  let total = 0;
  for (const g of grades) {
    matched += g.matched;
    total += g.total;
  }
  return { matched, total, pct: total ? Math.round((matched / total) * 100) : 100 };
}