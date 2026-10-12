import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pad } from "./utils";
import type { LessonItem } from "./types";

type Props = {
  next: LessonItem | undefined;
  allDone: boolean;
  firstLessonId: number | undefined;
  onOpen: (lessonId: number) => void;
};

export function SectionCta({ next, allDone, firstLessonId, onOpen }: Props) {
  if (next) {
    const verb = next.status === "learning" ? "Tiếp tục" : "Bắt đầu";
    return (
      <Button size="lg" onClick={() => onOpen(next.lesson.id)} className="group gap-2 shadow-md">
        <Play className="size-4 fill-current" />
        <span>
          {verb} · Bài {pad(next.order)}
        </span>
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
      </Button>
    );
  }

  if (allDone && firstLessonId != null) {
    return (
      <Button
        size="lg"
        variant="outline"
        onClick={() => onOpen(firstLessonId)}
        className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
      >
        <RotateCcw className="size-4" />
        Ôn lại từ đầu
      </Button>
    );
  }

  return null;
}