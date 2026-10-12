import type { LessonProgress } from "@/types";
import type {
  Lesson, LessonFilter, LessonItem, LessonStatus, LessonSummary,
} from "./types";

export const pad = (n: number) => String(n).padStart(2, "0");

const toPercent = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

export function toLessonItem(
  lesson: Lesson,
  index: number,
  progress: LessonProgress
): LessonItem {
  const total = lesson.sentences.length;
  const available = total > 0;

  // Chỉ đếm những câu còn tồn tại, tránh vượt quá 100% khi admin xoá câu
  const learnedSet = new Set(progress.learnedSentenceIds);
  const learned = lesson.sentences.filter((s) => learnedSet.has(s.id)).length;

  let status: LessonStatus = "not-started";
  if (available) {
    if (learned >= total) status = "completed";
    else if (learned > 0 || progress.status !== "not-started") status = "learning";
  }

  return {
    lesson,
    order: index + 1,
    status,
    learned,
    total,
    percent: toPercent(learned, total),
    available,
  };
}

export function summarize(items: LessonItem[]): LessonSummary {
  const counts: Record<LessonStatus, number> = {
    completed: 0,
    learning: 0,
    "not-started": 0,
  };
  let learnedSentences = 0;
  let totalSentences = 0;

  for (const item of items) {
    if (item.available) counts[item.status]++;
    learnedSentences += item.learned;
    totalSentences += item.total;
  }

  const playable = items.filter((i) => i.available);
  const next =
    playable.find((i) => i.status === "learning") ??
    playable.find((i) => i.status === "not-started");

  return {
    totalLessons: items.length,
    completedLessons: counts.completed,
    learnedSentences,
    totalSentences,
    percent: toPercent(learnedSentences, totalSentences),
    counts,
    next,
    allDone: playable.length > 0 && counts.completed === playable.length,
  };
}

export function filterLessonItems(items: LessonItem[], filter: LessonFilter) {
  if (filter === "all") return items;
  return items.filter((i) => i.available && i.status === filter);
}

export function getFilterCounts(
  items: LessonItem[],
  summary: LessonSummary
): Record<LessonFilter, number> {
  return { all: items.length, ...summary.counts };
}