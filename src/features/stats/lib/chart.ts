import { WEEKDAY_SHORT, addDays, fmtDM, formatDayLong, startOfWeek } from "@/lib/date";
import { STREAK_MIN_SECONDS } from "@/lib/study";
import { elapsedInWeek, sumDays, type Bar, type ChartRange, type Daily } from "./aggregate";
import { fmtShort } from "./format";

export const RANGES: { value: ChartRange; label: string; prevLabel: string }[] = [
  { value: "7d", label: "7 ngày", prevLabel: "7 ngày trước đó" },
  { value: "30d", label: "30 ngày", prevLabel: "30 ngày trước đó" },
  { value: "12w", label: "12 tuần", prevLabel: "12 tuần trước đó" },
];

export const isChartRange = (v: unknown): v is ChartRange =>
  RANGES.some((r) => r.value === v);

export const rangeInfo = (r: ChartRange) => RANGES.find((x) => x.value === r)!;

/** Mục tiêu của 1 cột. Tuần hiện tại chỉ tính số ngày đã qua */
export const targetOf = (b: Bar, goalSec: number) => goalSec * b.days;

/* ---------- Trục Y ---------- */

const STEP_MIN = [5, 10, 15, 30, 60, 120, 180, 300, 600];

/** Chọn bước chia tròn sao cho có khoảng `ticks` vạch */
export function niceScale(maxSec: number, ticks = 3) {
  const maxMin = Math.max(maxSec / 60, 1);
  const step =
    STEP_MIN.find((s) => s * ticks >= maxMin) ?? Math.ceil(maxMin / ticks / 60) * 60;
  const topMin = Math.ceil(maxMin / step) * step;
  return {
    top: topMin * 60,
    ticks: Array.from({ length: topMin / step + 1 }, (_, i) => i * step * 60),
  };
}

/* ---------- Tổng hợp ---------- */

export function summarizeBars(bars: Bar[], goalSec: number) {
  let total = 0;
  let activeDays = 0;
  let reached = 0;
  let maxSeconds = 0;
  for (const b of bars) {
    total += b.seconds;
    activeDays += b.activeDays;
    if (b.seconds >= targetOf(b, goalSec)) reached++;
    if (b.seconds > maxSeconds) maxSeconds = b.seconds;
  }
  return {
    total,
    activeDays,
    reached,
    maxSeconds,
    avgPerActive: activeDays ? total / activeDays : 0,
    avgPerBar: bars.length ? total / bars.length : 0,
  };
}

/** Tổng của kỳ liền trước, cùng độ dài với kỳ đang xem */
export function previousTotal(daily: Daily, today: Date, range: ChartRange): number {
  switch (range) {
    case "7d":
      return sumDays(daily, addDays(today, -13), 7);
    case "30d":
      return sumDays(daily, addDays(today, -59), 30);
    case "12w":
      // Kỳ hiện tại = 11 tuần đủ + phần đã qua của tuần này, kỳ trước lấy cùng độ dài
      return sumDays(daily, addDays(startOfWeek(today), -7 * 23), 77 + elapsedInWeek(today));
  }
}

export const deltaPct = (now: number, prev: number): number | null =>
  prev === 0 ? null : Math.round(((now - prev) / prev) * 100);

/* ---------- Văn bản ---------- */

export function barTitle(b: Bar, weekly: boolean): string {
  if (!weekly) return formatDayLong(b.date);
  return `Tuần ${fmtDM(b.date)} – ${fmtDM(addDays(b.date, 6))}`;
}

export function tickLabel(b: Bar, i: number, n: number, range: ChartRange): string {
  const fromEnd = n - 1 - i;
  if (range === "7d") return b.current ? "Nay" : WEEKDAY_SHORT[b.date.getDay()];
  if (range === "30d") return fromEnd % 5 === 0 ? String(b.date.getDate()) : "";
  return fromEnd % 2 === 0 ? fmtDM(b.date) : "";
}

export type BarTone = "success" | "warn" | "muted";

export function barStatus(b: Bar, goalSec: number, weekly: boolean): { text: string; tone: BarTone } {
  const target = targetOf(b, goalSec);
  if (b.seconds >= target) return { text: "Đạt mục tiêu ✓", tone: "success" };

  const left = fmtShort(target - b.seconds);
  if (weekly) {
    return {
      text: `Học ${b.activeDays}/${b.days} ngày · ${b.current ? "còn" : "thiếu"} ${left}`,
      tone: "muted",
    };
  }
  if (b.seconds === 0) return { text: b.current ? "Hôm nay chưa học" : "Không học", tone: "muted" };
  if (b.seconds < STREAK_MIN_SECONDS) return { text: "Chưa đủ 1 phút · không tính chuỗi", tone: "warn" };
  return { text: `${b.current ? "Còn" : "Thiếu"} ${left} tới mục tiêu`, tone: "muted" };
}