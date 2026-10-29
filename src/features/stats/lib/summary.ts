// lib/summary.ts
import { addDays, parseKey, startOfWeek } from "@/lib/date";
import { elapsedInWeek, secondsOn, sumDays, type Daily } from "./aggregate";

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
    if (secondsOn(daily, addDays(weekStart, i)) >= goalSec) goalDaysThisWeek++;
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

export type StudySummary = ReturnType<typeof summarize>;