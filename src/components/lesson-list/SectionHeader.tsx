import { ArrowLeft, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SectionCta } from "./SectionCta";
import type { Section } from "@/types";
import type { LessonSummary } from "./types";

type Props = {
  section: Section;
  summary: LessonSummary;
  firstLessonId: number | undefined;
  onBack: () => void;
  onOpen: (lessonId: number) => void;
};

export function SectionHeader({ section, summary, firstLessonId, onBack, onOpen }: Props) {
  return (
    <header className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tất cả chủ đề
      </Button>

      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-primary/10 via-card to-card p-5 shadow-sm sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <SectionProgress summary={summary} />

            <div className="min-w-0 space-y-1.5">
              <Badge variant="secondary" className="font-mono text-xs uppercase tracking-wider">
                {section.level}
              </Badge>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{section.title}</h1>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">
                  {summary.completedLessons}/{summary.totalLessons}
                </span>{" "}
                bài hoàn thành ·{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {summary.learnedSentences}/{summary.totalSentences}
                </span>{" "}
                câu
              </p>
            </div>
          </div>

          <SectionCta
            next={summary.next}
            allDone={summary.allDone}
            firstLessonId={firstLessonId}
            onOpen={onOpen}
          />
        </div>
      </div>
    </header>
  );
}

/** Nhỏ và chỉ dùng ở đây nên để chung file */
function SectionProgress({ summary }: { summary: LessonSummary }) {
  return (
    <ProgressRing
      value={summary.percent}
      size={72}
      strokeWidth={6}
      label={`Tiến độ chủ đề ${summary.percent}%`}
      indicatorClassName={summary.allDone ? "stroke-emerald-500" : "stroke-primary"}
      className="shrink-0"
    >
      {summary.allDone ? (
        <Trophy className="size-7 text-emerald-500" aria-hidden />
      ) : (
        <span className="text-base font-bold tabular-nums">{summary.percent}%</span>
      )}
    </ProgressRing>
  );
}