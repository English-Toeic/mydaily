// components/activity-chart/RangeTabs.tsx
import { cn } from "@/lib/utils";
import type { ChartRange } from "../../lib/aggregate";
import { RANGES } from "../../lib/chart";

interface Props {
  value: ChartRange;
  onChange: (r: ChartRange) => void;
}

export function RangeTabs({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Khoảng thời gian" className="flex shrink-0 rounded-lg bg-muted p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          role="radio"
          aria-checked={value === r.value}
          onClick={() => onChange(r.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === r.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}