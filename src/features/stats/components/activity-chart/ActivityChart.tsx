// components/activity-chart/ActivityChart.tsx
import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STREAK_MIN_SECONDS } from "@/lib/study";
import { chartBars, type ChartRange, type Daily } from "../../lib/aggregate";
import {
  barStatus, barTitle, deltaPct, niceScale, previousTotal,
  rangeInfo, summarizeBars, targetOf, tickLabel,
} from "../../lib/chart";
import { fmtShort } from "../../lib/format";
import { useChartRange } from "../../hooks/useChartRange";
import { RangeTabs } from "./RangeTabs";
import { ChartDelta } from "./ChartDelta";
import { BarTooltip } from "./BarTooltip";

interface Props {
  daily: Daily;
  today: Date;
  goalSec: number;
}

export function ActivityChart({ daily, today, goalSec }: Props) {
  const [range, setRange] = useChartRange();
  const [selected, setSelected] = useState<number | null>(null);
  const barRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pointerType = useRef<string | null>(null);

  const weekly = range === "12w";
  const info = rangeInfo(range);

  const bars = useMemo(() => chartBars(daily, today, range), [daily, today, range]);
  const prevTotal = useMemo(() => previousTotal(daily, today, range), [daily, today, range]);
  const sum = useMemo(() => summarizeBars(bars, goalSec), [bars, goalSec]);

  const fullTarget = weekly ? goalSec * 7 : goalSec;
  const scale = useMemo(
    () => niceScale(Math.max(sum.maxSeconds, fullTarget)),
    [sum.maxSeconds, fullTarget]
  );
  const y = (sec: number) => Math.min(sec / scale.top, 1) * 100;

  const goalY = y(fullTarget);
  const avgY = y(sum.avgPerBar);
  const showAvg = sum.avgPerBar > 0 && Math.abs(avgY - goalY) > 8;

  const n = bars.length;
  const active = selected !== null ? bars[selected] ?? null : null;
  const focusIndex = selected ?? n - 1;
  const gap = range === "30d" ? "gap-0.5" : "gap-1.5 sm:gap-2";

  /* ---------- Tương tác ---------- */

  const changeRange = (r: ChartRange) => {
    setRange(r);
    setSelected(null);
  };

  const handleClick = (i: number) => {
    // Chuột: hover đã chọn nên click giữ nguyên. Chạm/bàn phím: bật/tắt
    const mouse = pointerType.current === "mouse";
    pointerType.current = null;
    setSelected((s) => (mouse ? i : s === i ? null : i));
  };

  const moveTo = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    setSelected(next);
    barRefs.current[next]?.focus();
  };

  const onBarKey = (e: KeyboardEvent, i: number) => {
    const keys: Record<string, () => void> = {
      ArrowLeft: () => moveTo(i - 1),
      ArrowRight: () => moveTo(i + 1),
      Home: () => moveTo(0),
      End: () => moveTo(n - 1),
      Escape: () => setSelected(null),
    };
    const fn = keys[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  // Chạm vào khoảng trống giữa các cột thì bỏ chọn
  const onBackgroundClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) setSelected(null);
  };

  return (
    <Card className="p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Thời gian học</h3>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-bold tabular-nums">{fmtShort(sum.total)}</span>
            <ChartDelta pct={deltaPct(sum.total, prevTotal)} label={info.prevLabel} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            TB {fmtShort(sum.avgPerActive)}/ngày học · đạt mục tiêu {sum.reached}/{n}{" "}
            {weekly ? "tuần" : "ngày"}
          </p>
        </div>
        <RangeTabs value={range} onChange={changeRange} />
      </div>

      {/* Vùng vẽ */}
      <div className="relative mt-5 pl-9">
        {/* Trục Y */}
        <div aria-hidden className="absolute inset-y-0 left-0 w-9">
          {scale.ticks.map((t) => (
            <span
              key={t}
              className="absolute right-2 translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
              style={{ bottom: `${y(t)}%` }}
            >
              {t === 0 ? "0" : fmtShort(t)}
            </span>
          ))}
        </div>

        <div
          role="group"
          aria-label={`Biểu đồ thời gian học ${info.label}. Dùng phím mũi tên để xem từng cột`}
          className="relative h-44"
          onPointerLeave={(e) => e.pointerType === "mouse" && setSelected(null)}
        >
          {/* Lưới */}
          {scale.ticks.map((t) => (
            <div
              key={t}
              aria-hidden
              className={cn("absolute inset-x-0 border-t", t === 0 ? "border-border" : "border-border/50")}
              style={{ bottom: `${y(t)}%` }}
            />
          ))}

          {/* Đường mục tiêu */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-emerald-500/70"
            style={{ bottom: `${goalY}%` }}
          >
            <span
              className={cn(
                "absolute right-0 rounded bg-card px-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400",
                goalY > 85 ? "top-1" : "bottom-1"
              )}
            >
              Mục tiêu {fmtShort(fullTarget)}
            </span>
          </div>

          {/* Đường trung bình */}
          {showAvg && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 z-10 border-t border-dotted border-muted-foreground/60"
              style={{ bottom: `${avgY}%` }}
            >
              <span className="absolute bottom-1 left-0 rounded bg-card px-1 text-[10px] text-muted-foreground">
                TB {fmtShort(sum.avgPerBar)}
              </span>
            </div>
          )}

          {/* Cột */}
          <div className={cn("absolute inset-0 flex items-end", gap)} onClick={onBackgroundClick}>
            {bars.map((b, i) => {
              const ok = b.seconds >= targetOf(b, goalSec);
              const weak = !weekly && b.seconds > 0 && b.seconds < STREAK_MIN_SECONDS;
              const isSel = selected === i;
              const dim = selected !== null && !isSel;
              const status = barStatus(b, goalSec, weekly);

              return (
                <button
                  key={b.key}
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                  type="button"
                  tabIndex={i === focusIndex ? 0 : -1}
                  aria-pressed={isSel}
                  aria-label={`${barTitle(b, weekly)}: ${fmtShort(b.seconds)}. ${status.text}`}
                  onPointerDown={(e) => {
                    pointerType.current = e.pointerType;
                  }}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setSelected(i)}
                  onClick={() => handleClick(i)}
                  onKeyDown={(e) => onBarKey(e, i)}
                  className="flex h-full flex-1 items-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div
                    className={cn(
                      "w-full rounded-t-lg motion-safe:transition-all motion-safe:duration-500",
                      weak
                        ? "border border-dashed border-primary/60 bg-primary/10"
                        : ok
                          ? "bg-emerald-500"
                          : b.current
                            ? "bg-primary"
                            : "bg-primary/45",
                      dim && "opacity-40",
                      isSel && "brightness-110"
                    )}
                    style={{
                      height: `${y(b.seconds)}%`,
                      minHeight: weak ? 6 : b.seconds > 0 ? 3 : 0,
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Tooltip */}
          {active && selected !== null && (
            <BarTooltip
              index={selected}
              count={n}
              heightPct={y(active.seconds)}
              title={barTitle(active, weekly)}
              seconds={active.seconds}
              status={barStatus(active, goalSec, weekly)}
            />
          )}

          {/* Rỗng */}
          {sum.total === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="rounded-md bg-card/80 px-2 py-1 text-xs text-muted-foreground">
                Chưa có dữ liệu trong {info.label} qua
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nhãn trục X */}
      <div aria-hidden className={cn("mt-1.5 flex pl-9", gap)}>
        {bars.map((b, i) => (
          <span
            key={b.key}
            className={cn(
              "flex-1 truncate text-center text-[10px] text-muted-foreground",
              (b.current || selected === i) && "font-semibold text-foreground"
            )}
          >
            {tickLabel(b, i, n, range)}
          </span>
        ))}
      </div>

      {/* Đọc cho screen reader khi chọn cột */}
      <p className="sr-only" aria-live="polite">
        {active ? `${barTitle(active, weekly)}: ${fmtShort(active.seconds)}` : ""}
      </p>
    </Card>
  );
}