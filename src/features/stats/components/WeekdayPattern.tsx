// components/WeekdayPattern.tsx
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WEEKDAY_LONG, WEEKDAY_SHORT } from "@/lib/date";
import { WEEKDAY_WEEKS } from "../constants";
import type { WeekdayAvg } from "../lib/aggregate";
import { fmtShort } from "../lib/format";

export function WeekdayPattern({ data }: { data: WeekdayAvg[] }) {
  const max = Math.max(...data.map((d) => d.avg), 1);
  const top = data.reduce((a, b) => (b.avg > a.avg ? b : a));

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Thói quen theo thứ</h3>
      <p className="mb-4 mt-0.5 text-xs text-muted-foreground">
        {top.avg > 0 ? (
          <>
            Bạn học nhiều nhất vào <b className="text-foreground">{WEEKDAY_LONG[top.dow]}</b> ·{" "}
            {WEEKDAY_WEEKS} tuần qua
          </>
        ) : (
          "Chưa đủ dữ liệu"
        )}
      </p>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.dow} className="flex items-center gap-3 text-xs">
            <span className="w-6 text-muted-foreground">{WEEKDAY_SHORT[d.dow]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  d.dow === top.dow && top.avg > 0 ? "bg-primary" : "bg-primary/45"
                )}
                style={{ width: `${(d.avg / max) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right tabular-nums text-muted-foreground">{fmtShort(d.avg)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}