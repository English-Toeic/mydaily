export type PassageKind = "dialogue" | "speech";
/** read = đọc & nghe; write = nhập vai (hội thoại) / viết (bài nói) */
export type PassageMode = "read" | "write";

export interface PassageLine {
  /** Tên người nói. Bài nói thì null */
  speaker: string | null;
  /** [0] là đáp án chính, các phần tử sau là cách nói khác được chấp nhận */
  en: string[];
  vi: string;
}

export interface Passage {
  id: number;
  deck_id: number;
  kind: PassageKind;
  title: string;
  lines: PassageLine[];
  best_score: number | null;
  last_practiced_at: string | null;
}

export type PassageFields = Pick<Passage, "kind" | "title" | "lines">;

export const PASSAGE_KIND_LABEL: Record<PassageKind, string> = {
  dialogue: "Hội thoại",
  speech: "Bài nói",
};