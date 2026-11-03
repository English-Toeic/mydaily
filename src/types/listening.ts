export const CHOICE_KEYS = ["A", "B", "C", "D"] as const;
export type ChoiceKey = (typeof CHOICE_KEYS)[number];

export const isChoiceKey = (v: unknown): v is ChoiceKey =>
  typeof v === "string" && (CHOICE_KEYS as readonly string[]).includes(v);

export interface ListeningChoice {
  key: ChoiceKey;
  en: string;
  vi: string;
}

export interface ListeningSet {
  id: number;
  title: string;
  last_practiced_at: string | null;
}

export interface ListeningQuestion {
  id: number;
  set_id: number;
  sort_order: number;
  image_url: string | null;
  audio_url: string;
  /** Luôn đủ 4 phần tử theo thứ tự A B C D */
  choices: ListeningChoice[];
  correct: ChoiceKey;
  /** null = chưa học */
  learned_at: string | null;
}

export type ListeningQuestionFields = Pick<
  ListeningQuestion,
  "image_url" | "audio_url" | "choices" | "correct"
>;

/** Phạm vi câu khi bắt đầu học */
export type ListeningScope = "new" | "all";