import { Clock, Flame, GraduationCap } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { View } from "@/app/routes";
import { NAV_ITEMS } from "./navItems";
import { STREAK_MIN_SECONDS } from "@/hooks/useStudyTracker";

type Props = {
  view: View;
  streak: number;
  streakDoneToday: boolean;
  todaySeconds: number;
  counting: boolean;
  onNavigate: (view: View) => void;
};

export function AppHeader({ view, streak, streakDoneToday, todaySeconds, counting, onNavigate }: Props) {
  const remaining = Math.max(0, STREAK_MIN_SECONDS - todaySeconds);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate({ name: "sections" })}
          className="group flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Về trang chủ"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/60 shadow-md shadow-primary/25 transition-transform group-hover:scale-105 group-active:scale-95">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-sm font-bold tracking-tight">Dev English</span>
            <span className="text-[11px] text-muted-foreground">Learn by typing</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 rounded-full border bg-muted/40 p-1 md:flex" aria-label="Điều hướng chính">
          {NAV_ITEMS.map((item) => {
            const active = item.activeOn.includes(view.name);
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => onNavigate(item.target)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Stats chips */}
        <div className="flex items-center gap-2">
          <div
            title={
              streakDoneToday
                ? `Chuỗi ${streak} ngày, hôm nay đã xong`
                : `Học thêm ${formatDuration(remaining)} để ${streak ? "giữ" : "bắt đầu"} chuỗi`
            }
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums transition-colors",
              streakDoneToday
                ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Flame className={cn("size-4", streakDoneToday && "fill-orange-500/30")} />
            {streak}
          </div>

          <div
            title={counting ? "Đang tính giờ học" : "Tạm dừng, không có thao tác trong 5 giây"}
            className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm tabular-nums"
          >
            <span className="relative flex size-2">
              {counting && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
              )}
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full transition-colors",
                  counting ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
              />
            </span>
            <Clock className="size-4 text-muted-foreground" />
            {formatDuration(todaySeconds)}
          </div>
        </div>
      </div>
    </header>
  );
}