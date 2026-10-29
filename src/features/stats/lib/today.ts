// lib/today.ts
import { STREAK_MIN_SECONDS } from "@/lib/study";
import { fmtShort } from "./format";

export type TodayTone = "success" | "warn" | "muted";

export function todayStatus(p: {
  seconds: number;
  goalSec: number;
  streak: number;
  streakDoneToday: boolean;
}): { message: string; tone: TodayTone } {
  const { seconds, goalSec, streak, streakDoneToday } = p;

  if (seconds >= goalSec) return { message: "Đã đạt mục tiêu hôm nay 🎉", tone: "success" };

  if (streakDoneToday) {
    return {
      message: `Đã giữ chuỗi ✓ · còn ${fmtShort(goalSec - seconds)} nữa là đạt mục tiêu`,
      tone: "muted",
    };
  }

  const tone: TodayTone = streak > 0 ? "warn" : "muted";
  if (seconds === 0) {
    return {
      message: streak > 0 ? `Học hôm nay để giữ chuỗi ${streak} ngày 🔥` : "Hôm nay chưa học, bắt đầu thôi!",
      tone,
    };
  }
  const left = Math.ceil(STREAK_MIN_SECONDS - seconds);
  return { message: `Học thêm ${left}s để ${streak > 0 ? "giữ" : "bắt đầu"} chuỗi 🔥`, tone };
}