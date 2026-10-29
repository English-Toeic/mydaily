import { useMemo } from "react";
import { parseKey } from "@/lib/date";
import { weekdayAverages, type Daily } from "../lib/aggregate";
import { computeBestStreak } from "../lib/streak";
import { summarize } from "../lib/summary";

export function useStatsData(daily: Daily, todayKey: string, goalSec: number, streak: number) {
  const today = useMemo(() => parseKey(todayKey), [todayKey]);
  const summary = useMemo(() => summarize(daily, today, goalSec), [daily, today, goalSec]);
  const weekdays = useMemo(() => weekdayAverages(daily, today), [daily, today]);
  const historyBest = useMemo(() => computeBestStreak(daily), [daily]);

  return {
    today,
    todaySec: daily[todayKey] ?? 0,
    summary,
    weekdays,
    bestStreak: Math.max(historyBest, streak),
  };
}