// components/SummaryTiles.tsx
import { CalendarCheck, Clock, Flame, Trophy } from "lucide-react";
import { fmtDM } from "@/lib/date";
import { fmtShort } from "../lib/format";
import { streakHint } from "../lib/streak";
import type { StudySummary } from "../lib/summary";
import { StatTile } from "./StatTile";
import { WeekDelta } from "./WeekDelta";

interface Props {
  streak: number;
  bestStreak: number;
  streakDoneToday: boolean;
  summary: StudySummary;
}

export function SummaryTiles({ streak, bestStreak, streakDoneToday, summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        icon={Flame}
        tone={streakDoneToday ? "text-orange-500" : "text-muted-foreground"}
        label={streakDoneToday ? "Chuỗi ngày" : "Chuỗi ngày · chưa giữ hôm nay"}
        value={`${streak} ngày`}
        sub={streakHint(streak, bestStreak)}
      />
      <StatTile
        icon={CalendarCheck}
        tone="text-blue-500"
        label="Tuần này"
        value={fmtShort(summary.thisWeek)}
        sub={
          <>
            <WeekDelta now={summary.thisWeek} prev={summary.lastWeek} />
            <span className="block">
              Đạt mục tiêu {summary.goalDaysThisWeek}/{summary.elapsed} ngày
            </span>
          </>
        }
      />
      <StatTile
        icon={Clock}
        tone="text-emerald-500"
        label="Tổng cộng"
        value={fmtShort(summary.total)}
        sub={`${summary.activeDays} ngày đã học`}
      />
      <StatTile
        icon={Trophy}
        tone="text-violet-500"
        label="TB mỗi ngày học"
        value={fmtShort(summary.avgPerActive)}
        sub={
          summary.bestDay
            ? `Cao nhất: ${fmtShort(summary.bestDay.seconds)} (${fmtDM(summary.bestDay.date)})`
            : "Chưa có dữ liệu"
        }
      />
    </div>
  );
}