import { useState } from "react";
import type { LessonProgress, Section } from "@/types";
import type { LessonFilter } from "./types";
import { filterLessonItems, getFilterCounts, summarize, toLessonItem } from "./utils";

export function useLessonList(
  section: Section,
  getLesson: (id: number) => LessonProgress
) {
  const [filter, setFilter] = useState<LessonFilter>("all");

  // Không dùng useMemo: getLesson có thể đổi reference mỗi lần render, và danh sách nhỏ
  // nên tính lại trực tiếp vừa rẻ vừa luôn khớp với progress mới nhất.
  const items = section.lessons.map((lesson, i) =>
    toLessonItem(lesson, i, getLesson(lesson.id))
  );
  const summary = summarize(items);

  return {
    items,
    summary,
    filter,
    setFilter,
    resetFilter: () => setFilter("all"),
    visibleItems: filterLessonItems(items, filter),
    filterCounts: getFilterCounts(items, summary),
    firstPlayableId: items.find((i) => i.available)?.lesson.id,
  };
}