import { CheckCircle2, Lock } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { STATUS_META } from "./config";
import { pad } from "./utils";
import type { LessonItem } from "./types";

export function LessonCardIcon({ item }: { item: LessonItem }) {
  const { available, status, percent, order } = item;

  if (!available) {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
        <Lock className="size-4 text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="size-6 text-emerald-500" aria-hidden />
      </div>
    );
  }

  return (
    <ProgressRing
      value={percent}
      size={44}
      indicatorClassName={STATUS_META[status].ring}
      className="shrink-0"
    >
      <span className="font-mono text-xs font-semibold">{pad(order)}</span>
    </ProgressRing>
  );
}