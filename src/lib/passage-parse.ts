import type { PassageKind, PassageLine } from "@/types/passage";

export interface LineDraft {
  key: string; // key ổn định cho React khi đổi chỗ/xoá dòng
  speaker: string;
  en: string;
  /** Cách nói khác, ngăn cách bởi "|" */
  alts: string;
  vi: string;
}

let seq = 0;
export const newDraft = (speaker = "", en = "", vi = "", alts = ""): LineDraft => ({
  key: `line-${++seq}`,
  speaker,
  en,
  alts,
  vi,
});

/**
 * "Tien: ", "Project Manager: ". Tên viết hoa chữ đầu, tối đa 2 từ.
 * Không cho dấu "." trong tên để "…said OK. Mike:" không bị hiểu thành người nói "OK. Mike".
 */
const SPEAKER_RE = /(?<![\p{L}\p{N}'’])(\p{Lu}[\p{L}'’-]{0,23}(?: \p{Lu}[\p{L}'’-]{0,23})?):\s*/gu;

/** Tách câu cho bài nói, tránh cắt ở "Mr.", "e.g."… */
const SENTENCE_SPLIT =
  /(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|St|vs|e\.g|i\.e)\.)(?<=[.!?…]["”’)]?)\s+(?=["“(]?\p{Lu})/u;

const join = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join(" ");

function splitTurns(text: string): { speaker: string | null; text: string }[] {
  const matches = [...text.matchAll(SPEAKER_RE)];
  if (!matches.length) return [{ speaker: null, text: text.trim() }];

  const out: { speaker: string | null; text: string }[] = [];
  const head = text.slice(0, matches[0].index ?? 0).trim();
  if (head) out.push({ speaker: null, text: head });

  matches.forEach((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    const body = text.slice(start, end).trim();
    if (body) out.push({ speaker: m[1], text: body });
  });
  return out;
}

/**
 * Hỗ trợ cả 2 kiểu dán:
 * - Mỗi lượt 1 dòng, dòng "= …" là tiếng Việt, dòng "+ …" là cách nói khác
 * - Cả đoạn liền "Sarah: … Tien: … Mike: …" (tự tách theo "Tên:")
 */
export function parsePastedText(text: string, kind: PassageKind): LineDraft[] {
  const drafts: LineDraft[] = [];
  const last = (): LineDraft | undefined => drafts[drafts.length - 1];
  // Bài nói: nếu đã có dòng "=" thì người dùng tự chia câu, không tách nữa
  const splitSpeech = kind === "speech" && !/^\s*=/m.test(text);

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("=")) {
      const d = last();
      if (d) d.vi = join(d.vi, line.slice(1));
      continue;
    }
    if (line.startsWith("+")) {
      const d = last();
      const alt = line.slice(1).trim();
      if (d && alt) d.alts = d.alts ? `${d.alts} | ${alt}` : alt;
      continue;
    }

    if (kind === "dialogue") {
      for (const t of splitTurns(line)) {
        const d = last();
        // Dòng không có "Tên:" và lượt trước chưa có tiếng Việt thì là phần nối tiếp của lượt đó
        if (!t.speaker && d && !d.vi) {
          d.en = join(d.en, t.text);
          continue;
        }
        drafts.push(newDraft(t.speaker ?? "", t.text));
      }
    } else {
      const parts = splitSpeech ? line.split(SENTENCE_SPLIT) : [line];
      for (const p of parts) if (p.trim()) drafts.push(newDraft("", p.trim()));
    }
  }
  return drafts;
}

export const toLineDrafts = (lines: PassageLine[]): LineDraft[] =>
  lines.map((l) => newDraft(l.speaker ?? "", l.en[0] ?? "", l.vi, l.en.slice(1).join(" | ")));

export type BuildLinesResult =
  | { ok: true; lines: PassageLine[] }
  | { ok: false; error: string };

export function buildLines(drafts: LineDraft[], kind: PassageKind): BuildLinesResult {
  const lines: PassageLine[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const en = d.en.trim();
    const vi = d.vi.trim();
    const speaker = d.speaker.trim();
    if (!en && !vi && !speaker && !d.alts.trim()) continue; // dòng trống, bỏ qua

    const row = `Dòng ${i + 1}`;
    if (!en) return { ok: false, error: `${row}: thiếu câu tiếng Anh` };
    if (!vi) return { ok: false, error: `${row}: thiếu nghĩa tiếng Việt` };
    if (kind === "dialogue" && !speaker) return { ok: false, error: `${row}: thiếu tên người nói` };

    const alts = d.alts.split("|").map((s) => s.trim()).filter(Boolean);
    lines.push({
      speaker: kind === "dialogue" ? speaker : null,
      en: [...new Set([en, ...alts])],
      vi,
    });
  }
  if (!lines.length) return { ok: false, error: "Chưa có dòng nào" };
  return { ok: true, lines };
}

export const speakersOf = (lines: PassageLine[]): string[] => [
  ...new Set(lines.map((l) => l.speaker).filter((s): s is string => !!s)),
];