// components/TodayCard.tsx
import { Card } from "@/components/ui/card";
import { cn, formatDuration } from "@/lib/utils";
import { STREAK_MIN_SECONDS } from "@/lib/study";
import { todayStatus, type TodayTone } from "../lib/today";
import { GoalRing } from "./GoalRing";
import { GoalSelect } from "./GoalSelect";

const TONE_CLASS: Record<TodayTone, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  warn: "text-orange-600 dark:text-orange-400",
  muted: "text-muted-foreground",
};

interface Props {
  seconds: number;
  goalMin: number;
  onGoalChange: (m: number) => void;
  streak: number;
  streakDoneToday: boolean;
}

export function TodayCard({ seconds, goalMin, onGoalChange, streak, streakDoneToday }: Props) {
  const goalSec = goalMin * 60;
  const done = seconds >= goalSec;
  const { message, tone } = todayStatus({ seconds, goalSec, streak, streakDoneToday });

  return (
    <Card className="flex items-center gap-5 p-5">
      <GoalRing
        pct={Math.min(seconds / goalSec, 1)}
        done={done}
        markerPct={Math.min(STREAK_MIN_SECONDS / goalSec, 1)}
        markerReached={streakDoneToday}
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">Hôm nay</p>
        <p className="text-3xl font-bold tabular-nums">{formatDuration(seconds)}</p>
        <p className={cn("mt-1 text-sm", TONE_CLASS[tone])}>{message}</p>
        <GoalSelect value={goalMin} onChange={onGoalChange} />
      </div>
    </Card>
  );
}