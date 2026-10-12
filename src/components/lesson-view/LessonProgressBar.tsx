import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/** Bài dài hơn số này thì dùng thanh liền thay vì từng ô */
const MAX_SEGMENTS = 40;

type Props = {
  index: number;
  total: number;
  learnedCount: number;
  percent: number;
  /** marks[i] = câu i đã thuộc */
  marks?: boolean[];
  showStep: boolean;
  isCurrentLearned: boolean;
};

export function LessonProgressBar({
  index, total, learnedCount, percent, marks, showStep, isCurrentLearned,
}: Props) {
  const segmented = !!marks && marks.length > 0 && marks.length <= MAX_SEGMENTS;

  return (
    <div className="space-y-2.5">
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          {showStep ? (
            <span className="text-muted-foreground">
              Câu{" "}
              <span className="tabular-nums text-foreground">{index + 1}</span>
              <span className="tabular-nums">/{total}</span>
            </span>
          ) : (
            <span className="font-medium">Tổng kết</span>
          )}
          {showStep && isCurrentLearned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="size-3" /> Đã thuộc
            </span>
          )}
        </div>

        <div className="text-right text-xs text-muted-foreground tabular-nums">
          <span className="text-base font-semibold text-foreground">{percent}%</span>
          <span className="ml-1.5">· {learnedCount}/{total} đã thuộc</span>
        </div>
      </div>

      {segmented ? (
        <div
          role="progressbar"
          aria-label="Tiến độ bài học"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="flex gap-1"
        >
          {marks!.map((learned, i) => (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors duration-300",
                learned ? "bg-emerald-500" : "bg-muted",
                showStep && i === index && "ring-primary ring-offset-1 ring-offset-background",
                showStep && i === index && !learned && "bg-primary/40"
              )}
            />
          ))}
        </div>
      ) : (
        <Progress value={percent} className="h-2" aria-label="Tiến độ bài học" />
      )}
    </div>
  );
}