// components/activity-chart/ActivityChart.tsx
import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STREAK_MIN_SECONDS } from "@/lib/study";
import { chartBars, type ByKind, type ChartRange, type Daily } from "../../lib/aggregate";
import {
  barStatus, barTitle, deltaPct, niceScale, previousTotal,
  rangeInfo, summarizeBars, targetOf, tickLabel,
} from "../../lib/chart";
import { fmtShort } from "../../lib/format";
import { useChartRange } from "../../hooks/useChartRange";
import { RangeTabs } from "./RangeTabs";
import { ChartDelta } from "./ChartDelta";
import { BarTooltip } from "./BarTooltip";
import { SEGMENTS } from "../../lib/segments";

interface Props {
  daily: Daily;
  byKind?: ByKind;
  today: Date;
  goalSec: number;
}

export function ActivityChart({ daily, byKind = {}, today, goalSec }: Props) {
  const [range, setRange] = useChartRange();
  const [selected, setSelected] = useState<number | null>(null);
  const barRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pointerType = useRef<string | null>(null);

  const weekly = range === "12w";
  const info = rangeInfo(range);

  const bars = useMemo(() => chartBars(daily, today, range, byKind), [daily, today, range, byKind]);
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

      {/* Chú thích màu */}
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {SEGMENTS.filter((s) => s.key !== "other" || sum.parts.other > 0).map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", s.bar)} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-medium tabular-nums">{fmtShort(sum.parts[s.key])}</span>
          </li>
        ))}
      </ul>

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
              const ok = b.seconds > 0 && b.seconds >= targetOf(b, goalSec);
              const weak = !weekly && b.seconds > 0 && b.seconds < STREAK_MIN_SECONDS;
              const isSel = selected === i;
              const dim = selected !== null && !isSel;
              const status = barStatus(b, goalSec, weekly);
              const breakdown = SEGMENTS.filter((s) => b.parts[s.key] > 0)
                .map((s) => `${s.label} ${fmtShort(b.parts[s.key])}`)
                .join(", ");

              return (
                <button
                  key={b.key}
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                  type="button"
                  tabIndex={i === focusIndex ? 0 : -1}
                  aria-pressed={isSel}
                  aria-label={`${barTitle(b, weekly)}: ${fmtShort(b.seconds)}${breakdown ? ` (${breakdown})` : ""}. ${status.text}`}
                  onPointerDown={(e) => {
                    pointerType.current = e.pointerType;
                  }}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setSelected(i)}
                  onClick={() => handleClick(i)}
                  onKeyDown={(e) => onBarKey(e, i)}
                  className="flex h-full flex-1 items-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div
                    className="relative w-full"
                    style={{
                      height: `${y(b.seconds)}%`,
                      minHeight: b.seconds > 0 ? 3 : 0,
                    }}
                  >
                    {/* Đạt mục tiêu: chấm xanh trên đỉnh cột */}
                    {ok && (
                      <span className="absolute -top-2.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-emerald-500" />
                    )}

                    {/* Cột chồng: flex-col-reverse để phần đầu tiên nằm dưới đáy */}
                    <div
                      className={cn(
                        "flex h-full w-full flex-col-reverse overflow-hidden rounded-t-[3px] transition-opacity",
                        dim && "opacity-40",
                        weak && !dim && "opacity-60"
                      )}
                    >
                      {SEGMENTS.map(
                        (s) =>
                          b.parts[s.key] > 0 && (
                            <div
                              key={s.key}
                              className={s.bar}
                              style={{ height: `${(b.parts[s.key] / b.seconds) * 100}%` }}
                            />
                          )
                      )}
                    </div>
                  </div>
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
              parts={active.parts}
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