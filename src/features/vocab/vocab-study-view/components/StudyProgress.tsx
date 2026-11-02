import { Flame } from "lucide-react";
import type { useStudySession } from "../../useStudySession";

type Session = ReturnType<typeof useStudySession>["session"];

const percent = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

export function StudyProgress({ session }: { session: Session }) {
  const { cleared, total, stats } = session;
  const progress = percent(cleared, total);
  const accuracy = stats.answered ? percent(stats.passed, stats.answered) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{cleared}</span>/{total} đã qua
        </span>
        <div className="flex items-center gap-3">
          {stats.streak >= 2 && (
            <span className="inline-flex items-center gap-1 font-semibold text-orange-500">
              <Flame className="size-3.5" /> {stats.streak}
            </span>
          )}
          {accuracy !== null && (
            <span className="tabular-nums text-muted-foreground">{accuracy}% chính xác</span>
          )}
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Tiến độ phiên học"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}