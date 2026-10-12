import type { Lesson, LessonProgress } from "@/types";

export type Sentence = Lesson["sentences"][number];

/** answering → (wrong ↺) → correct | revealed */
export type AnswerStatus = "answering" | "wrong" | "correct" | "revealed";
export type SessionView = "practice" | "completion";
/** learn: chỉ đi qua câu chưa thuộc · review: đi tuần tự, không đổi tiến độ */
export type SessionMode = "learn" | "review";

export type HintToken = { text: string; hidden: boolean };

export type LessonViewProps = {
  lesson: Lesson;
  progress: LessonProgress;
  onBack: () => void;
  onCorrect: (sentenceId: number) => void;
  onActivity: () => void;
  onReset: () => void;
};