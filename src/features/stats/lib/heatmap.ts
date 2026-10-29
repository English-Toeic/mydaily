// lib/heatmap.ts
import { addDays, dateKey, startOfWeek } from "@/lib/date";
import type { Daily } from "./aggregate";

export type HeatCell = { key: string; date: Date; seconds: number; future: boolean };
export type HeatLevel = 0 | 1 | 2 | 3 | 4;

/** Mức đậm của heatmap, tính theo % mục tiêu */
export function levelOf(sec: number, goalSec: number): HeatLevel {
  if (sec <= 0) return 0;
  const r = sec / goalSec;
  return r < 0.5 ? 1 : r < 1 ? 2 : r < 2 ? 3 : 4;
}

/** Lưới N tuần, mỗi cột là 1 tuần (T2 → CN), cột cuối là tuần hiện tại */
export function buildHeatmap(daily: Daily, today: Date, weeks: number): HeatCell[][] {
  const start = addDays(startOfWeek(today), -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d): HeatCell => {
      const date = addDays(start, w * 7 + d);
      const key = dateKey(date);
      return { key, date, seconds: daily[key] ?? 0, future: date > today };
    })
  );
}

/** Nhãn tháng phía trên mỗi cột, chỉ hiện ở cột đầu tiên của tháng */
export function monthLabels(columns: HeatCell[][]): string[] {
  return columns.map((col, w) => {
    const month = col[0].date.getMonth();
    const label = `Thg ${month + 1}`;
    if (w === 0) {
      // Tránh chồng chữ nếu ngay cột sau đã sang tháng mới
      return columns[1]?.[0].date.getMonth() === month ? label : "";
    }
    return columns[w - 1][0].date.getMonth() !== month ? label : "";
  });
}