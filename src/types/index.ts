// src/types/index.ts
export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "Toeic" | "Other";
export type LessonStatus = "not-started" | "learning" | "completed";

export interface Sentence {
  id: number;
  english: string;
  vietnamese: string;
  sort_order?: number;
  created_at?: string;
}

export interface Lesson {
  id: number;
  section_id?: number;
  title: string;
  parts: number;
  level: Level;
  sentences: Sentence[]; // rỗng nếu chưa nhập data
  sort_order?: number;
  created_at?: string;
}

export interface Section {
  id: number;
  title: string;
  level: Level;
  lessons: Lesson[];
  sort_order?: number;
  created_at?: string;
}

// ---- Progress ----
export interface LessonProgress {
  status: LessonStatus;
  learnedSentenceIds: number[]; // câu đã trả lời đúng
  lastOpenedAt?: string;
}

export interface ProgressState {
  lessons: Record<number, LessonProgress>; // key = lessonId
}

// ---- Study tracker ----
export interface DailyStudy {
  date: string;       // YYYY-MM-DD
  seconds: number;    // giờ học có thao tác
}

export interface StudyState {
  daily: Record<string, number>; // date -> seconds
  streak: number;
  lastStudyDate?: string;         // YYYY-MM-DD
}