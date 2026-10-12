import { Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Props = {
  index: number;
  total: number;
  learnedCount: number;
  percent: number;
  showStep: boolean;
  isCurrentLearned: boolean;
};

export function LessonProgressBar({
  index, total, learnedCount, percent, showStep, isCurrentLearned,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          {showStep ? (
            <span>
              Câu <span className="font-medium tabular-nums text-foreground">{index + 1}</span>/{total}
            </span>
          ) : (
            <span>Tổng kết</span>
          )}
          {showStep && isCurrentLearned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" /> Đã thuộc
            </span>
          )}
        </span>
        <span className="tabular-nums">
          {learnedCount}/{total} câu đã thuộc · {percent}%
        </span>
      </div>
      <Progress value={percent} className="h-2" aria-label="Tiến độ bài học" />
    </div>
  );
}