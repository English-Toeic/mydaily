import { cn } from "@/lib/utils";
import { FILTERS } from "./config";
import type { LessonFilter } from "./types";

type Props = {
  value: LessonFilter;
  counts: Record<LessonFilter, number>;
  onChange: (filter: LessonFilter) => void;
};

export function FilterBar({ value, counts, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Lọc bài học theo trạng thái"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {FILTERS.map((f) => {
        const active = value === f.value;
        return (
          <button
            key={f.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(f.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                active ? "bg-primary-foreground/20" : "bg-muted"
              )}
            >
              {counts[f.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}