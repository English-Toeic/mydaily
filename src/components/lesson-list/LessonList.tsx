import { BookOpen, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useLessonList } from "./useLessonList";
import { SectionHeader } from "./SectionHeader";
import { FilterBar } from "./FilterBar";
import { LessonGrid } from "./LessonGrid";
import type { LessonListProps } from "./types";

export function LessonList({ section, getLesson, onBack, onOpenLesson }: LessonListProps) {
  const {
    items, summary, filter, setFilter, resetFilter,
    visibleItems, filterCounts, firstPlayableId,
  } = useLessonList(section, getLesson);

  return (
    <div className="space-y-6">
      <SectionHeader
        section={section}
        summary={summary}
        firstLessonId={firstPlayableId}
        onBack={onBack}
        onOpen={onOpenLesson}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Chủ đề này chưa có bài học"
          description="Nội dung đang được chuẩn bị, bạn quay lại sau nhé."
        />
      ) : (
        <div className="space-y-4">
          <FilterBar value={filter} counts={filterCounts} onChange={setFilter} />

          {visibleItems.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Không có bài nào ở trạng thái này"
              action={
                <Button variant="outline" size="sm" onClick={resetFilter}>
                  Xem tất cả
                </Button>
              }
            />
          ) : (
            <LessonGrid
              items={visibleItems}
              nextId={summary.next?.lesson.id}
              onOpen={onOpenLesson}
            />
          )}
        </div>
      )}
    </div>
  );
}