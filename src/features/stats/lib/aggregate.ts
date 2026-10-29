// lib/aggregate.ts
import { addDays, dateKey, startOfWeek } from "@/lib/date";
import { WEEKDAY_WEEKS } from "../constants";
import { STREAK_MIN_SECONDS } from "@/lib/study";

export type Daily = Record<string, number>;

export type Bar = {
  key: string;
  date: Date;
  /** Số ngày cột này bao gồm (1 với cột ngày, ≤ 7 với cột tuần) */
  days: number;
  seconds: number;
  /** Số ngày trong cột đủ ngưỡng tính chuỗi */
  activeDays: number;
  current: boolean;
};

export type ChartRange = "7d" | "30d" | "12w";

export const secondsOn = (daily: Daily, d: Date) => daily[dateKey(d)] ?? 0;

/** Số ngày đã qua trong tuần (Thứ Hai = 1 … Chủ nhật = 7) */
export const elapsedInWeek = (d: Date) => ((d.getDay() + 6) % 7) + 1;

export function sumDays(daily: Daily, from: Date, count: number): number {
  let s = 0;
  for (let i = 0; i < count; i++) s += secondsOn(daily, addDays(from, i));
  return s;
}

export function countActive(daily: Daily, from: Date, count: number): number {
  let n = 0;
  for (let i = 0; i < count; i++) {
    if (secondsOn(daily, addDays(from, i)) >= STREAK_MIN_SECONDS) n++;
  }
  return n;
}

export function dayBars(daily: Daily, today: Date, n: number): Bar[] {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i - (n - 1));
    const seconds = secondsOn(daily, date);
    return {
      key: dateKey(date),
      date,
      days: 1,
      seconds,
      activeDays: seconds >= STREAK_MIN_SECONDS ? 1 : 0,
      current: i === n - 1,
    };
  });
}

export function weekBars(daily: Daily, today: Date, n: number): Bar[] {
  const thisWeek = startOfWeek(today);
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(thisWeek, -7 * (n - 1 - i));
    const current = i === n - 1;
    // Tuần hiện tại chỉ tính đến hôm nay
    const days = current ? elapsedInWeek(today) : 7;
    return {
      key: dateKey(date),
      date,
      days,
      seconds: sumDays(daily, date, days),
      activeDays: countActive(daily, date, days),
      current,
    };
  });
}

export function chartBars(daily: Daily, today: Date, range: ChartRange): Bar[] {
  switch (range) {
    case "7d":
      return dayBars(daily, today, 7);
    case "30d":
      return dayBars(daily, today, 30);
    case "12w":
      return weekBars(daily, today, 12);
  }
}

/** Trung bình theo thứ trong N tuần gần nhất, thứ tự T2 → CN */
export function weekdayAverages(daily: Daily, today: Date, weeks = WEEKDAY_WEEKS) {
  const sum = Array<number>(7).fill(0);
  const count = Array<number>(7).fill(0);
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(today, -i);
    sum[d.getDay()] += secondsOn(daily, d);
    count[d.getDay()]++;
  }
  return [1, 2, 3, 4, 5, 6, 0].map((dow) => ({
    dow,
    avg: count[dow] ? sum[dow] / count[dow] : 0,
  }));
}

export type WeekdayAvg = ReturnType<typeof weekdayAverages>[number];