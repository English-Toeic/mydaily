// src/lib/lessonTitle.ts
const SEP = String.raw`(?:\s*(?:-|–|—|~|to|through|and|đến|tới)\s*|\s+)`;
const RANGE = String.raw`(\d{1,3})(?:${SEP}(\d{1,3}))?`;

const PATTERNS = [
  new RegExp(String.raw`\bquestions?\s*(?:no\.?|number)?\s*` + RANGE, "i"),
  new RegExp(String.raw`câu(?:\s*hỏi)?\s*(?:số)?\s*` + RANGE, "i"),
];

export function extractTitle(
  candidates: (string | null | undefined)[],
  fallback: string
): string {
  // 1. Tìm "Question xx-yy" trong các câu đầu
  for (const text of candidates) {
    if (!text) continue;
    for (const re of PATTERNS) {
      const m = text.match(re);
      if (!m) continue;
      const a = Number(m[1]);
      const b = m[2] ? Number(m[2]) : NaN;
      return b > a ? `Question ${a}-${b}` : `Question ${a}`;
    }
  }

  // 2. Không có số câu → dùng câu đầu tiên
  const first = candidates.find((t) => t?.trim())?.trim();
  if (first) {
    const sentence = first.split(/(?<=[.!?])\s/)[0];
    return sentence.length > 60 ? sentence.slice(0, 57) + "…" : sentence;
  }

  // 3. Cuối cùng → tên file
  return fallback;
}