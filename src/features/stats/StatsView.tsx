import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StudyState } from "@/types";
import type { Deck } from "@/types/vocab";
import { useDailyGoal } from "./hooks/useDailyGoal";
import { useStatsData } from "./hooks/useStatsData";
import { StatsSkeleton } from "./components/StatsSkeleton";
import { TodayCard } from "./components/TodayCard";
import { SummaryTiles } from "./components/SummaryTiles";
import { ActivityChart } from "./components/activity-chart";
import { ActivityHeatmap } from "./components/ActivityHeatmap";
import { WeekdayPattern } from "./components/WeekdayPattern";
import { VocabProgress } from "./components/VocabProgress";

interface Props {
  study: StudyState;
  todayKey: string;
  streakDoneToday: boolean;
  ready: boolean;
  loadError?: string | null;
  /** Truyền vào nếu muốn hiện tiến độ từ vựng */
  decks?: Deck[];
  onBack: () => void;
}

export function StatsView({ study, todayKey, streakDoneToday, ready, loadError, decks, onBack }: Props) {
  const [goalMin, setGoalMin] = useDailyGoal();
  const goalSec = goalMin * 60;
  const { daily, streak } = study;
  const { today, todaySec, summary, weekdays, bestStreak } = useStatsData(daily, todayKey, goalSec, streak);
  const hasDecks = !!decks && decks.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 pb-8">
      <div className="mb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại">
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="text-lg font-bold">Thống kê học tập</h2>
      </div>

      {loadError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
          Không tải được lịch sử học. Số liệu bên dưới có thể chưa đầy đủ.
        </p>
      )}

      {!ready ? (
        <StatsSkeleton />
      ) : (
        <>
          <TodayCard
            seconds={todaySec}
            goalMin={goalMin}
            onGoalChange={setGoalMin}
            streak={streak}
            streakDoneToday={streakDoneToday}
          />

          <SummaryTiles
            streak={streak}
            bestStreak={bestStreak}
            streakDoneToday={streakDoneToday}
            summary={summary}
          />

          <ActivityChart daily={daily} today={today} goalSec={goalSec} />
          <ActivityHeatmap daily={daily} today={today} goalSec={goalSec} />

          <div className={cn("grid gap-4", hasDecks && "sm:grid-cols-2")}>
            <WeekdayPattern data={weekdays} />
            {hasDecks && <VocabProgress decks={decks} />}
          </div>
        </>
      )}
    </div>
  );
}