import { addDays, dateKey, parseKey, startOfWeek } from "@/lib/date";

export type Daily = Record<string, number>;

export type Bar = {
  key: string;
  date: Date;
  /** Số ngày cột này bao gồm (1 với cột ngày, ≤ 7 với cột tuần) */
  days: number;
  seconds: number;
  current: boolean;
};

const get = (daily: Daily, d: Date) => daily[dateKey(d)] ?? 0;

/** Số ngày đã qua trong tuần (Thứ Hai = 1 … Chủ nhật = 7) */
export const elapsedInWeek = (d: Date) => ((d.getDay() + 6) % 7) + 1;

export function sumDays(daily: Daily, from: Date, count: number): number {
  let s = 0;
  for (let i = 0; i < count; i++) s += get(daily, addDays(from, i));
  return s;
}

export function dayBars(daily: Daily, today: Date, n: number): Bar[] {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i - (n - 1));
    return { key: dateKey(date), date, days: 1, seconds: get(daily, date), current: i === n - 1 };
  });
}

export function weekBars(daily: Daily, today: Date, n: number): Bar[] {
  const thisWeek = startOfWeek(today);
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(thisWeek, -7 * (n - 1 - i));
    const current = i === n - 1;
    // Tuần hiện tại chỉ tính đến hôm nay
    const days = current ? elapsedInWeek(today) : 7;
    return { key: dateKey(date), date, days, seconds: sumDays(daily, date, days), current };
  });
}

export function computeStreaks(daily: Daily, today: Date) {
  const keys = Object.keys(daily)
    .filter((k) => daily[k] > 0)
    .sort();

  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    run = prev && dateKey(addDays(prev, 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = parseKey(k);
  }

  // Chưa học hôm nay thì chuỗi vẫn còn nếu hôm qua có học
  let current = 0;
  let cursor = get(daily, today) > 0 ? today : addDays(today, -1);
  while (get(daily, cursor) > 0) {
    current++;
    cursor = addDays(cursor, -1);
  }

  return { current, best };
}

export function summarize(daily: Daily, today: Date, goalSec: number) {
  let total = 0;
  let activeDays = 0;
  let bestDay: { date: Date; seconds: number } | null = null;

  for (const [k, s] of Object.entries(daily)) {
    if (s <= 0) continue;
    total += s;
    activeDays++;
    if (!bestDay || s > bestDay.seconds) bestDay = { date: parseKey(k), seconds: s };
  }

  const weekStart = startOfWeek(today);
  const elapsed = elapsedInWeek(today);
  // So với cùng kỳ tuần trước (Thứ Hai → cùng thứ) cho công bằng
  const thisWeek = sumDays(daily, weekStart, elapsed);
  const lastWeek = sumDays(daily, addDays(weekStart, -7), elapsed);

  let goalDaysThisWeek = 0;
  for (let i = 0; i < elapsed; i++) {
    if (get(daily, addDays(weekStart, i)) >= goalSec) goalDaysThisWeek++;
  }

  return {
    total,
    activeDays,
    avgPerActive: activeDays ? total / activeDays : 0,
    bestDay,
    thisWeek,
    lastWeek,
    elapsed,
    goalDaysThisWeek,
  };
}

/** Trung bình theo thứ trong N tuần gần nhất, thứ tự T2 → CN */
export function weekdayAverages(daily: Daily, today: Date, weeks = 12) {
  const sum = Array(7).fill(0);
  const count = Array(7).fill(0);
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(today, -i);
    sum[d.getDay()] += get(daily, d);
    count[d.getDay()]++;
  }
  return [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
    dow,
    avg: count[dow] ? sum[dow] / count[dow] : 0,
  }));
}

/** Mức đậm của heatmap, tính theo % mục tiêu */
export function levelOf(sec: number, goalSec: number): 0 | 1 | 2 | 3 | 4 {
  if (sec <= 0) return 0;
  const r = sec / goalSec;
  return r < 0.5 ? 1 : r < 1 ? 2 : r < 2 ? 3 : 4;
}

/** Dạng ngắn: "<1p", "25p", "1g05", "2g" */
export function fmtShort(sec: number): string {
  const m = Math.round(sec / 60);
  if (sec > 0 && m === 0) return "<1p";
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}g${String(r).padStart(2, "0")}` : `${h}g`;
}