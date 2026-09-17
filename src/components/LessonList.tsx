// src/components/LessonList.tsx
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Circle, Loader2, Lock } from "lucide-react";
import type { LessonProgress, Section } from "@/types";

interface Props {
  section: Section;
  getLesson: (id: number) => LessonProgress;
  onBack: () => void;
  onOpenLesson: (lessonId: number) => void;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: "Đã học",
    className: "border-emerald-500/40 bg-emerald-500/5",
    iconClass: "text-emerald-500",
  },
  learning: {
    icon: Loader2,
    label: "Đang học",
    className: "border-blue-500/40 bg-blue-500/5",
    iconClass: "text-blue-500",
  },
  "not-started": {
    icon: Circle,
    label: "Chưa học",
    className: "border-border",
    iconClass: "text-muted-foreground",
  },
} as const;

export function LessonList({ section, getLesson, onBack, onOpenLesson }: Props) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <Badge variant="secondary" className="mb-1">
            {section.level}
          </Badge>
          <h2 className="text-lg font-bold">{section.title}</h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {section.lessons.map((lesson) => {
          const prog = getLesson(lesson.id);

          const cfg = statusConfig[prog.status];
          const Icon = cfg.icon;
          const hasData = lesson.sentences.length > 0;
          const ids = prog.learnedSentenceIds;  
          // const targetId = ids.length > 0 ? ids[ids.length - 1] + 1 : lesson.id;
            
          return (
            <Card
              key={lesson.id}
              onClick={() => hasData && onOpenLesson(lesson.id)}
              className={cn(
                "p-4 transition-all",
                cfg.className,
                hasData
                  ? "cursor-pointer hover:shadow-md"
                  : "cursor-not-allowed opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {hasData ? (
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        cfg.iconClass,
                        prog.status === "learning" && "animate-spin"
                      )}
                    />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Bài {lesson.id}
                    </span>
                  </div>
                  <h3 className="truncate text-sm font-semibold">
                    {lesson.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hasData
                      ? `${ids.length}/${lesson.parts} câu · ${cfg.label}`
                      : "Chưa có dữ liệu"}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}