// components/ActivityHeatmap.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { dateKey, formatDayLong } from "@/lib/date";
import { STREAK_MIN_SECONDS } from "@/lib/study";
import { HEATMAP_WEEKS } from "../constants";
import type { Daily } from "../lib/aggregate";
import { fmtShort } from "../lib/format";
import { buildHeatmap, levelOf, monthLabels, type HeatLevel } from "../lib/heatmap";

const LEVEL_CLASS: Record<HeatLevel, string> = {
  0: "bg-muted",
  1: "bg-emerald-500/25",
  2: "bg-emerald-500/50",
  3: "bg-emerald-500/75",
  4: "bg-emerald-500",
};
const ROW_LABELS = ["T2", "", "T4", "", "T6", "", "CN"];

interface Props {
  daily: Daily;
  today: Date;
  goalSec: number;
}

export function ActivityHeatmap({ daily, today, goalSec }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = dateKey(today);

  const columns = useMemo(() => buildHeatmap(daily, today, HEATMAP_WEEKS), [daily, today]);
  const months = useMemo(() => monthLabels(columns), [columns]);
  const cells = useMemo(() => columns.flat(), [columns]);

  const selected = selectedKey ? cells.find((c) => c.key === selectedKey) ?? null : null;
  const activeCount = cells.filter((c) => c.seconds >= STREAK_MIN_SECONDS).length;

  // Mobile: cuộn sẵn tới tuần hiện tại
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Lịch học</h3>
        <span className="text-xs text-muted-foreground">
          {activeCount} ngày học · {HEATMAP_WEEKS} tuần qua
        </span>
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div className="flex w-max gap-1">
          <div className="mr-1 flex flex-col gap-1 pt-5 text-[10px] text-muted-foreground">
            {ROW_LABELS.map((l, i) => (
              <span key={i} className="h-3.5 leading-3.5">
                {l}
              </span>
            ))}
          </div>

          {columns.map((col, w) => (
            <div key={col[0].key} className="flex flex-col gap-1">
              <span className="h-4 whitespace-nowrap text-[10px] leading-4 text-muted-foreground">
                {months[w]}
              </span>
              {col.map((cell) =>
                cell.future ? (
                  <span key={cell.key} className="size-3.5" />
                ) : (
                  <button
                    key={cell.key}
                    type="button"
                    title={`${formatDayLong(cell.date)}: ${fmtShort(cell.seconds)}`}
                    aria-label={`${formatDayLong(cell.date)}: ${fmtShort(cell.seconds)}`}
                    aria-pressed={selectedKey === cell.key}
                    onClick={() => setSelectedKey((k) => (k === cell.key ? null : cell.key))}
                    className={cn(
                      "size-3.5 rounded-[3px] transition hover:ring-2 hover:ring-foreground/20",
                      LEVEL_CLASS[levelOf(cell.seconds, goalSec)],
                      cell.key === todayStr && "outline-1 outline-offset-1 outline-foreground/40",
                      selectedKey === cell.key && "ring-2 ring-foreground/60"
                    )}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="min-h-4">
          {selected ? (
            <>
              {formatDayLong(selected.date)}: <b className="text-foreground">{fmtShort(selected.seconds)}</b>
              {selected.seconds > 0 && selected.seconds < STREAK_MIN_SECONDS && " · chưa đủ để tính chuỗi"}
            </>
          ) : (
            "Chạm vào ô để xem chi tiết"
          )}
        </span>
        <span className="flex items-center gap-1">
          Ít
          {Object.values(LEVEL_CLASS).map((c) => (
            <span key={c} className={cn("size-3 rounded-[3px]", c)} />
          ))}
          Nhiều
        </span>
      </div>
    </Card>
  );
}