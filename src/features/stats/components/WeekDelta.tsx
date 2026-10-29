// components/WeekDelta.tsx
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function WeekDelta({ now, prev }: { now: number; prev: number }) {
  if (prev === 0) {
    return <span className="block">{now > 0 ? "Tuần trước chưa học" : "Chưa học tuần này"}</span>;
  }
  const pct = Math.round(((now - prev) / prev) * 100);
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  return (
    <span
      title="So với cùng kỳ tuần trước"
      className={cn(
        "flex items-center gap-0.5 font-medium",
        pct > 0 && "text-emerald-600 dark:text-emerald-400",
        pct < 0 && "text-red-500"
      )}
    >
      <Icon className="size-3" />
      {pct > 0 ? "+" : ""}
      {pct}% so với tuần trước
    </span>
  );
}