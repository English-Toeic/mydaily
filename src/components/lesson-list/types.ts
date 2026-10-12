import type { LucideIcon } from "lucide-react";
import type { LessonProgress, Section } from "@/types";

export type Lesson = Section["lessons"][number];
export type LessonStatus = LessonProgress["status"];
export type LessonFilter = "all" | LessonStatus;

export type LessonListProps = {
  section: Section;
  getLesson: (id: number) => LessonProgress;
  onBack: () => void;
  onOpenLesson: (lessonId: number) => void;
};

export type LessonItem = {
  lesson: Lesson;
  /** Số thứ tự trong chủ đề, bắt đầu từ 1 */
  order: number;
  status: LessonStatus;
  learned: number;
  total: number;
  percent: number;
  available: boolean;
};

export type LessonSummary = {
  totalLessons: number;
  completedLessons: number;
  learnedSentences: number;
  totalSentences: number;
  percent: number;
  counts: Record<LessonStatus, number>;
  next: LessonItem | undefined;
  allDone: boolean;
};

export type StatusMeta = {
  label: string;
  action: string;
  actionIcon: LucideIcon;
  badge: string;
  ring: string;
  cardHover: string;
};