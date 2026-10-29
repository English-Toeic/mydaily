// components/activity-chart/ChartDelta.tsx
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChartDelta({ pct, label }: { pct: number | null; label: string }) {
  if (pct === null) return null;
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        pct > 0 && "text-emerald-600 dark:text-emerald-400",
        pct < 0 && "text-red-600 dark:text-red-400",
        pct === 0 && "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {pct > 0 ? "+" : ""}
      {pct}% so với {label}
    </span>
  );
}