// lib/streak.ts
import { addDays, dateKey, parseKey } from "@/lib/date";
import { STREAK_MIN_SECONDS } from "@/lib/study";
import { MILESTONES } from "../constants";
import type { Daily } from "./aggregate";

/** Chuỗi dài nhất trong lịch sử, cùng ngưỡng với tracker */
export function computeBestStreak(daily: Daily): number {
  // Key dạng YYYY-MM-DD (có số 0 đệm) nên sort chuỗi cũng là sort theo ngày
  const keys = Object.keys(daily)
    .filter((k) => daily[k] >= STREAK_MIN_SECONDS)
    .sort();

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of keys) {
    run = prev !== null && dateKey(addDays(parseKey(prev), 1)) === k ? run + 1 : 1;
    if (run > best) best = run;
    prev = k;
  }
  return best;
}

export function streakHint(streak: number, best: number): string {
  if (streak >= 2 && streak >= best) return "🏆 Đang là kỷ lục của bạn";
  const next = MILESTONES.find((m) => m > streak);
  if (next && streak > 0) return `Còn ${next - streak} ngày tới mốc ${next}`;
  return `Kỷ lục: ${best} ngày`;
}