import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WEEKDAY_SHORT, addDays, fmtDM, formatDayLong } from "@/lib/date";
import { dayBars, fmtShort, weekBars, type Bar, type Daily } from "./stats";

type Range = "7d" | "30d" | "12w";

const RANGES: { value: Range; label: string }[] = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "12w", label: "12 tuần" },
];

interface Props {
  daily: Daily;
  today: Date;
  goalSec: number;
}

export function ActivityChart({ daily, today, goalSec }: Props) {
  const [range, setRange] = useState<Range>("7d");
  const [selected, setSelected] = useState<number | null>(null);
  const weekly = range === "12w";

  const bars = useMemo(
    () =>
      range === "7d" ? dayBars(daily, today, 7)
      : range === "30d" ? dayBars(daily, today, 30)
      : weekBars(daily, today, 12),
    [daily, today, range]
  );

  const target = weekly ? goalSec * 7 : goalSec;
  const max = Math.max(...bars.map((b) => b.seconds), target, 1);
  const total = bars.reduce((s, b) => s + b.seconds, 0);
  const totalDays = bars.reduce((s, b) => s + b.days, 0);
  const reached = bars.filter((b) => b.seconds >= target).length;
  const active = selected !== null ? bars[selected] : null;
  const gap = range === "30d" ? "gap-0.5" : "gap-1.5 sm:gap-2";

  const titleOf = (b: Bar) =>
    weekly ? `Tuần ${fmtDM(b.date)} – ${fmtDM(addDays(b.date, 6))}` : formatDayLong(b.date);

  const labelOf = (b: Bar, i: number) => {
    const fromEnd = bars.length - 1 - i;
    if (range === "7d") return b.current ? "Nay" : WEEKDAY_SHORT[b.date.getDay()];
    if (range === "30d") return fromEnd % 5 === 0 ? String(b.date.getDate()) : "";
    return fromEnd % 2 === 0 ? fmtDM(b.date) : "";
  };

  return (
    <Card className="p-5">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Thời gian học</h3>
          <p className="mt-0.5 min-h-4 text-xs text-muted-foreground">
            {active ? (
              <>
                {titleOf(active)}:{" "}
                <b className="text-foreground">{fmtShort(active.seconds)}</b>
                {active.seconds >= target && (
                  <span className="text-emerald-600 dark:text-emerald-400"> · đạt mục tiêu ✓</span>
                )}
              </>
            ) : (
              <>
                Tổng <b className="text-foreground">{fmtShort(total)}</b> · TB{" "}
                {fmtShort(totalDays ? total / totalDays : 0)}/ngày · đạt mục tiêu {reached}/
                {bars.length} {weekly ? "tuần" : "ngày"}
              </>
            )}
          </p>
        </div>

        <div role="tablist" className="inline-flex shrink-0 rounded-lg bg-muted p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="tab"
              aria-selected={range === r.value}
              onClick={() => {
                setRange(r.value);
                setSelected(null);
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition",
                range === r.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-40" onMouseLeave={() => setSelected(null)}>
        {/* Đường mục tiêu */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-emerald-500/70"
          style={{ bottom: `${(target / max) * 100}%` }}
        >
          <span className="absolute -top-4 right-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Mục tiêu {fmtShort(target)}
          </span>
        </div>

        <div className={cn("flex h-full items-end", gap)}>
          {bars.map((b, i) => {
            const ok = b.seconds >= target;
            const isSel = selected === i;
            return (
              <button
                key={b.key}
                type="button"
                onMouseEnter={() => setSelected(i)}
                onClick={() => setSelected(i)}
                aria-label={`${titleOf(b)}: ${fmtShort(b.seconds)}`}
                className="flex h-full flex-1 items-end outline-none"
              >
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all duration-500",
                    b.seconds === 0 ? "bg-muted" : ok ? "bg-emerald-500" : "bg-primary/70",
                    selected !== null && !isSel && "opacity-40"
                  )}
                  style={{
                    height: b.seconds ? `max(${(b.seconds / max) * 100}%, 4px)` : "3px",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn("mt-2 flex", gap)}>
        {bars.map((b, i) => (
          <span
            key={b.key}
            className={cn(
              "flex-1 whitespace-nowrap text-center text-[10px] text-muted-foreground",
              b.current && "font-semibold text-foreground"
            )}
          >
            {labelOf(b, i)}
          </span>
        ))}
      </div>
    </Card>
  );
}