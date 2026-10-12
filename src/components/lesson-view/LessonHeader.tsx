import { ArrowLeft, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/types";
import type { SessionMode } from "./types";

type Props = { lesson: Lesson; mode: SessionMode; onBack: () => void };

/** Màu theo nhóm trình độ CEFR: A (cơ bản), B (trung cấp), C (nâng cao) */
const LEVEL_STYLES: Record<string, string> = {
  A: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400",
  B: "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400",
  C: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-400",
};

const levelClass = (level: string) =>
  LEVEL_STYLES[String(level).charAt(0).toUpperCase()] ??
  "bg-muted text-muted-foreground ring-border";

export function LessonHeader({ lesson, mode, onBack }: Props) {
  return (
    <header className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        aria-label="Quay lại danh sách bài"
        className="shrink-0 rounded-full"
      >
        <ArrowLeft className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold leading-tight tracking-tight sm:text-xl">
          {lesson.title}
        </h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className={cn("border-0 px-2 font-semibold ring-1 ring-inset", levelClass(lesson.level))}
          >
            {lesson.level}
          </Badge>
          <span>{lesson.sentences.length} câu</span>
          {mode === "review" && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                <Repeat className="size-3" /> Đang ôn tập
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}