import { useMemo, type ReactNode } from "react";
import {
  ArrowLeft, BookOpen, CalendarCheck, Clock, Flame, Minus,
  TrendingDown, TrendingUp, Trophy, type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";
import { WEEKDAY_LONG, WEEKDAY_SHORT, dateKey, fmtDM, parseKey } from "@/lib/date";
import type { StudyState } from "@/types";
import type { Deck } from "@/types/vocab";
import { computeStreaks, fmtShort, summarize, weekdayAverages } from "./stats";
import { GOAL_PRESETS, useDailyGoal } from "./useDailyGoal";
import { ActivityChart } from "./ActivityChart";
import { ActivityHeatmap } from "./ActivityHeatmap";

interface Props {
  study: StudyState;
  /** Truyền vào nếu muốn hiện tiến độ từ vựng */
  decks?: Deck[];
  onBack: () => void;
}

export function StatsView({ study, decks, onBack }: Props) {
  const [goalMin, setGoalMin] = useDailyGoal();
  const goalSec = goalMin * 60;
  const daily = study.daily;

  const todayStr = dateKey();
  const today = useMemo(() => parseKey(todayStr), [todayStr]);
  const todaySec = daily[todayStr] ?? 0;

  const summary = useMemo(() => summarize(daily, today, goalSec), [daily, today, goalSec]);
  const streaks = useMemo(() => computeStreaks(daily, today), [daily, today]);
  const weekdays = useMemo(() => weekdayAverages(daily, today), [daily, today]);

  const streak = study.streak;
  const bestStreak = Math.max(streaks.best, streak);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 pb-8">
      <div className="mb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại">
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="text-lg font-bold">Thống kê học tập</h2>
      </div>

      <TodayCard seconds={todaySec} goalMin={goalMin} onGoalChange={setGoalMin} streak={streak} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Flame}
          tone="text-orange-500"
          label="Chuỗi ngày"
          value={`${streak} ngày`}
          sub={streak > 0 && streak >= bestStreak ? "🏆 Kỷ lục mới!" : `Kỷ lục: ${bestStreak} ngày`}
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

      <ActivityChart daily={daily} today={today} goalSec={goalSec} />
      <ActivityHeatmap daily={daily} today={today} goalSec={goalSec} />

      <div className={cn("grid gap-4", decks && decks.length > 0 && "sm:grid-cols-2")}>
        <WeekdayPattern data={weekdays} />
        {decks && decks.length > 0 && <VocabProgress decks={decks} />}
      </div>
    </div>
  );
}

/* ---------- Các component nhỏ ---------- */

function TodayCard({
  seconds, goalMin, onGoalChange, streak,
}: {
  seconds: number;
  goalMin: number;
  onGoalChange: (m: number) => void;
  streak: number;
}) {
  const goalSec = goalMin * 60;
  const pct = Math.min(seconds / goalSec, 1);
  const done = seconds >= goalSec;
  const R = 42;
  const C = 2 * Math.PI * R;

  const message = done
    ? "Đã đạt mục tiêu hôm nay 🎉"
    : seconds === 0
      ? streak > 0
        ? `Học hôm nay để giữ chuỗi ${streak} ngày 🔥`
        : "Hôm nay chưa học, bắt đầu thôi!"
      : `Còn ${fmtShort(goalSec - seconds)} nữa là đạt mục tiêu`;

  return (
    <Card className="flex items-center gap-5 p-5">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="10" className="stroke-muted" />
          {pct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              className={cn(
                "transition-[stroke-dashoffset] duration-700",
                done ? "stroke-emerald-500" : "stroke-primary"
              )}
            />
          )}
        </svg>
        <span className="absolute inset-0 grid place-items-center text-lg font-bold tabular-nums">
          {Math.round(pct * 100)}%
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">Hôm nay</p>
        <p className="text-3xl font-bold tabular-nums">{formatDuration(seconds)}</p>
        <p
          className={cn(
            "mt-1 text-sm",
            done
              ? "text-emerald-600 dark:text-emerald-400"
              : seconds === 0 && streak > 0
                ? "text-orange-600 dark:text-orange-400"
                : "text-muted-foreground"
          )}
        >
          {message}
        </p>
        <label className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
          Mục tiêu mỗi ngày
          <select
            value={goalMin}
            onChange={(e) => onGoalChange(Number(e.target.value))}
            className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
          >
            {GOAL_PRESETS.map((m) => (
              <option key={m} value={m}>
                {m} phút
              </option>
            ))}
          </select>
        </label>
      </div>
    </Card>
  );
}

function StatTile({
  icon: Icon, tone, label, value, sub,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className={cn("mb-2 flex items-center gap-1.5 text-xs font-medium", tone)}>
        <Icon className="size-4" />
        {label}
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <div className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function WeekDelta({ now, prev }: { now: number; prev: number }) {
  if (prev === 0) {
    return <span className="block">{now > 0 ? "Tuần trước chưa học" : "Chưa học tuần này"}</span>;
  }
  const pct = Math.round(((now - prev) / prev) * 100);
  const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
  return (
    <span
      title="So với cùng kỳ tuần trước"
      className={cn(
        "flex items-center gap-0.5 font-medium",
        pct > 0 && "text-emerald-600 dark:text-emerald-400",
        pct < 0 && "text-red-500"
      )}
    >
      <Icon className="size-3" />
      {pct > 0 ? "+" : ""}
      {pct}% so với tuần trước
    </span>
  );
}

function WeekdayPattern({ data }: { data: { dow: number; avg: number }[] }) {
  const max = Math.max(...data.map((d) => d.avg), 1);
  const top = data.reduce((a, b) => (b.avg > a.avg ? b : a));

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold">Thói quen theo thứ</h3>
      <p className="mb-4 mt-0.5 text-xs text-muted-foreground">
        {top.avg > 0 ? (
          <>
            Bạn học nhiều nhất vào{" "}
            <b className="text-foreground">{WEEKDAY_LONG[top.dow]}</b> · 12 tuần qua
          </>
        ) : (
          "Chưa đủ dữ liệu"
        )}
      </p>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.dow} className="flex items-center gap-3 text-xs">
            <span className="w-6 text-muted-foreground">{WEEKDAY_SHORT[d.dow]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  d.dow === top.dow && top.avg > 0 ? "bg-primary" : "bg-primary/45"
                )}
                style={{ width: `${(d.avg / max) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right tabular-nums text-muted-foreground">
              {fmtShort(d.avg)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function VocabProgress({ decks }: { decks: Deck[] }) {
  const stats = useMemo(() => {
    let fresh = 0;
    let learning = 0;
    let learned = 0;
    let nearest: { name: string; left: number; pct: number } | null = null;

    for (const d of decks) {
      let done = 0;
      for (const w of d.words) {
        if (w.status === "new") fresh++;
        else if (w.status === "learning") learning++;
        else {
          learned++;
          done++;
        }
      }
      const left = d.words.length - done;
      if (d.words.length > 0 && left > 0) {
        const pct = done / d.words.length;
        if (!nearest || pct > nearest.pct) nearest = { name: d.name, left, pct };
      }
    }
    return { fresh, learning, learned, total: fresh + learning + learned, nearest };
  }, [decks]);

  const { fresh, learning, learned, total, nearest } = stats;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
        <BookOpen className="size-4 text-primary" />
        Từ vựng
      </div>
      <p className="text-3xl font-bold tabular-nums">
        {Math.round(pct(learned))}%
        <span className="ml-1.5 text-sm font-normal text-muted-foreground">
          đã thuộc ({learned}/{total})
        </span>
      </p>

      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${pct(learned)}%` }} />
        <div className="bg-orange-400 transition-all duration-500" style={{ width: `${pct(learning)}%` }} />
        <div className="bg-blue-500/60 transition-all duration-500" style={{ width: `${pct(fresh)}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Legend dot="bg-emerald-500" label="Thuộc" value={learned} />
        <Legend dot="bg-orange-400" label="Đang học" value={learning} />
        <Legend dot="bg-blue-500/60" label="Mới" value={fresh} />
      </div>

      {nearest && (
        <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Sắp xong: <b className="text-foreground">“{nearest.name}”</b> còn {nearest.left} từ
        </p>
      )}
    </Card>
  );
}

function Legend({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div>
      <p className="font-semibold tabular-nums">{value}</p>
      <p className="flex items-center gap-1 text-muted-foreground">
        <span className={cn("size-2 rounded-full", dot)} />
        {label}
      </p>
    </div>
  );
}