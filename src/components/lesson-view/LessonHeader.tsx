import { ArrowLeft, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/types";
import type { SessionMode } from "./types";

type Props = { lesson: Lesson; mode: SessionMode; onBack: () => void };

export function LessonHeader({ lesson, mode, onBack }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại danh sách bài">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex min-w-0 items-center gap-2">
        <Badge variant="secondary" className="shrink-0">{lesson.level}</Badge>
        <h1 className="truncate font-medium">{lesson.title}</h1>
        {mode === "review" && (
          <Badge variant="outline" className="shrink-0 gap-1">
            <Repeat className="h-3 w-3" /> Ôn tập
          </Badge>
        )}
      </div>
    </div>
  );
}