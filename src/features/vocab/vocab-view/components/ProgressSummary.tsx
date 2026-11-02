// components/ProgressSummary.tsx
import { cn } from "@/lib/utils";
import { learnedPct, type Counts } from "../lib/counts";
import { STATUS } from "../ui";
import { DeckBar } from "./DeckBar";

export function ProgressSummary({ counts }: { counts: Counts }) {
  return (
    <section aria-label="Tiến độ tổng" className="rounded-2xl border bg-card p-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tiến độ tổng
          </p>
          <p className="text-3xl font-bold tabular-nums">{learnedPct(counts)}%</p>
        </div>
        <div className="flex gap-4 sm:gap-6">
          {STATUS.map((s) => (
            <Legend key={s.key} label={s.label} value={counts[s.key]} dot={s.dot} />
          ))}
        </div>
      </div>
      <DeckBar counts={counts} className="mt-3 h-2" />
    </section>
  );
}

function Legend({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="text-right">
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <span className={cn("size-2 rounded-full", dot)} /> {label}
      </p>
    </div>
  );
}