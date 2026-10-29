import { useState } from "react";

const KEY = "stats:daily-goal";
export const GOAL_PRESETS = [5, 10, 15, 20, 30, 45, 60];

/** Mục tiêu học mỗi ngày (phút), lưu trong localStorage */
export function useDailyGoal() {
  const [minutes, setMinutes] = useState(() => {
    const v = Number(localStorage.getItem(KEY));
    return v > 0 ? v : 60;
  });

  const update = (m: number) => {
    setMinutes(m);
    localStorage.setItem(KEY, String(m));
  };

  return [minutes, update] as const;
}