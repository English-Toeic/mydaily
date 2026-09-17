// src/components/SectionList.tsx
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
// import { sections } from "@/data/lessons";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { LessonProgress, Section } from "@/types";

interface Props {
  sections: Section[]; 
  getLesson: (id: number) => LessonProgress;
  onOpenSection: (sectionId: number) => void;
}

export function SectionList({ sections, getLesson, onOpenSection }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => {
        const total = section.lessons.length;
        const done = section.lessons.filter(
          (l) => getLesson(l.id).status === "completed"
        ).length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <Card
            key={section.id}
            onClick={() => onOpenSection(section.id)}
            className={cn(
              "group cursor-pointer p-5 transition-all",
              "hover:border-primary/50 hover:shadow-lg"
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <Badge variant="secondary">{section.level}</Badge>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <h3 className="mb-4 text-base font-semibold leading-snug">
              {section.title}
            </h3>
            <div className="space-y-2">
              <Progress value={percent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {done}/{total} bài · {percent}%
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}