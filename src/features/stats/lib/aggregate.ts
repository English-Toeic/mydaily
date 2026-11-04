// lib/aggregate.ts
import { addDays, dateKey, startOfWeek } from "@/lib/date";
import { WEEKDAY_WEEKS } from "../constants";
import { STREAK_MIN_SECONDS } from "@/lib/study";
import type { KindSeconds, StudyKind } from "@/types";

export type Daily = Record<string, number>;
export type ByKind = Record<string, KindSeconds>;

/** "other" = phần tổng không thuộc phần nào (dữ liệu trước khi tách theo phần) */
export type PartKey = StudyKind | "other";
export type BarParts = Record<PartKey, number>;
export const PART_KEYS: PartKey[] = ["lesson", "vocab", "listening", "other"];

export const emptyParts = (): BarParts => ({ lesson: 0, vocab: 0, listening: 0, other: 0 });

export type Bar = {
  key: string;
  date: Date;
  /** Số ngày cột này bao gồm (1 với cột ngày, ≤ 7 với cột tuần) */
  days: number;
  seconds: number;
  /** Số giây theo từng phần, cộng lại = seconds */
  parts: BarParts;
  /** Số ngày trong cột đủ ngưỡng tính chuỗi */
  activeDays: number;
  current: boolean;
};

export type ChartRange = "7d" | "30d" | "12w";

export const secondsOn = (daily: Daily, d: Date) => daily[dateKey(d)] ?? 0;

export function partsOn(daily: Daily, byKind: ByKind, d: Date): BarParts {
  const k = dateKey(d);
  const p = byKind[k];
  const lesson = p?.lesson ?? 0;
  const vocab = p?.vocab ?? 0;
  const listening = p?.listening ?? 0;
  const total = daily[k] ?? 0;
  return { lesson, vocab, listening, other: Math.max(0, total - lesson - vocab - listening) };
}

function sumParts(daily: Daily, byKind: ByKind, from: Date, count: number): BarParts {
  const acc = emptyParts();
  for (let i = 0; i < count; i++) {
    const p = partsOn(daily, byKind, addDays(from, i));
    for (const k of PART_KEYS) acc[k] += p[k];
  }
  return acc;
}

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

export function dayBars(daily: Daily, today: Date, n: number, byKind: ByKind = {}): Bar[] {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i - (n - 1));
    const seconds = secondsOn(daily, date);
    return {
      key: dateKey(date),
      date,
      days: 1,
      seconds,
      parts: partsOn(daily, byKind, date),
      activeDays: seconds >= STREAK_MIN_SECONDS ? 1 : 0,
      current: i === n - 1,
    };
  });
}

export function weekBars(daily: Daily, today: Date, n: number, byKind: ByKind = {}): Bar[] {
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
      parts: sumParts(daily, byKind, date, days),
      activeDays: countActive(daily, date, days),
      current,
    };
  });
}

export function chartBars(
  daily: Daily,
  today: Date,
  range: ChartRange,
  byKind: ByKind = {}
): Bar[] {
  switch (range) {
    case "7d":
      return dayBars(daily, today, 7, byKind);
    case "30d":
      return dayBars(daily, today, 30, byKind);
    case "12w":
      return weekBars(daily, today, 12, byKind);
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