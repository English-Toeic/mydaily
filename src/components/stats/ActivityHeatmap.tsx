import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { addDays, dateKey, formatDayLong, startOfWeek } from "@/lib/date";
import { fmtShort, levelOf, type Daily } from "./stats";

const WEEKS = 20;
const LEVEL_CLASS = [
  "bg-muted",
  "bg-emerald-500/25",
  "bg-emerald-500/50",
  "bg-emerald-500/75",
  "bg-emerald-500",
];
const ROW_LABELS = ["T2", "", "T4", "", "T6", "", "CN"];

type Cell = { key: string; date: Date; seconds: number; future: boolean };

interface Props {
  daily: Daily;
  today: Date;
  goalSec: number;
}

export function ActivityHeatmap({ daily, today, goalSec }: Props) {
  const [selected, setSelected] = useState<Cell | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = dateKey(today);

  const columns = useMemo(() => {
    const start = addDays(startOfWeek(today), -7 * (WEEKS - 1));
    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d): Cell => {
        const date = addDays(start, w * 7 + d);
        const key = dateKey(date);
        return { key, date, seconds: daily[key] ?? 0, future: date > today };
      })
    );
  }, [daily, today]);

  const activeCount = columns.flat().filter((c) => c.seconds > 0).length;

  // Mobile: cuộn sẵn tới tuần hiện tại
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const monthLabel = (w: number) => {
    const month = columns[w][0].date.getMonth();
    if (w === 0) {
      // Tránh chồng chữ nếu ngay cột sau đã sang tháng mới
      return columns[1]?.[0].date.getMonth() === month ? `Thg ${month + 1}` : "";
    }
    return columns[w - 1][0].date.getMonth() !== month ? `Thg ${month + 1}` : "";
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Lịch học</h3>
        <span className="text-xs text-muted-foreground">
          {activeCount} ngày học · {WEEKS} tuần qua
        </span>
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-1">
        <div className="flex w-max gap-1">
          <div className="mr-1 flex flex-col gap-1 pt-5 text-[10px] text-muted-foreground">
            {ROW_LABELS.map((l, i) => (
              <span key={i} className="h-3.5 leading-[14px]">
                {l}
              </span>
            ))}
          </div>

          {columns.map((col, w) => (
            <div key={col[0].key} className="flex flex-col gap-1">
              <span className="h-4 whitespace-nowrap text-[10px] leading-4 text-muted-foreground">
                {monthLabel(w)}
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
                    onClick={() => setSelected(selected?.key === cell.key ? null : cell)}
                    className={cn(
                      "size-3.5 rounded-[3px] transition hover:ring-2 hover:ring-foreground/20",
                      LEVEL_CLASS[levelOf(cell.seconds, goalSec)],
                      cell.key === todayStr && "outline outline-1 outline-offset-1 outline-foreground/40",
                      selected?.key === cell.key && "ring-2 ring-foreground/60"
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
              {formatDayLong(selected.date)}:{" "}
              <b className="text-foreground">{fmtShort(selected.seconds)}</b>
            </>
          ) : (
            "Chạm vào ô để xem chi tiết"
          )}
        </span>
        <span className="flex items-center gap-1">
          Ít
          {LEVEL_CLASS.map((c) => (
            <span key={c} className={cn("size-3 rounded-[3px]", c)} />
          ))}
          Nhiều
        </span>
      </div>
    </Card>
  );
}