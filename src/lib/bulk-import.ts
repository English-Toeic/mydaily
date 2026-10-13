import { normalizeText } from "./vocab-search";


export interface BulkRow {
  english: string;
  meaning: string;
  ipa: string | null;
}

export interface BulkParseResult {
  rows: BulkRow[];
  /** Số thứ tự dòng (bắt đầu từ 1) không hợp lệ */
  invalidLines: number[];
  /** Các từ bị bỏ qua vì đã có trong deck hoặc lặp lại trong danh sách */
  duplicates: string[];
}

export function parseBulk(
  text: string,
  existingEnglish: Iterable<string> = []
): BulkParseResult {
  const seen = new Set<string>();
  for (const e of existingEnglish) seen.add(normalizeText(e.trim()));

  const rows: BulkRow[] = [];
  const invalidLines: number[] = [];
  const duplicates: string[] = [];

  text.split("\n").forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) return;

    const [english = "", meaning = "", ipa = ""] = line
      .split(/\t|\|/)
      .map((s) => s.trim());

    if (!english || !meaning) {
      invalidLines.push(idx + 1);
      return;
    }

    const key = normalizeText(english);
    if (seen.has(key)) {
      duplicates.push(english);
      return;
    }
    seen.add(key);
    rows.push({ english, meaning, ipa: ipa || null });
  });

  return { rows, invalidLines, duplicates };
}