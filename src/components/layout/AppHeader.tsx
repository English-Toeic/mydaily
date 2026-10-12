import { Clock, Flame, GraduationCap } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { View } from "@/app/routes";
import { NAV_ITEMS } from "./navItems";

type Props = {
  view: View;
  streak: number;
  todaySeconds: number;
  onNavigate: (view: View) => void;
};

export function AppHeader({ view, streak, todaySeconds, onNavigate }: Props) {
  const studiedToday = todaySeconds > 0;

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
        <div className="flex items-center gap-1 rounded-full border bg-background/80 p-1 shadow-sm">
          <span
            title={studiedToday ? "Đã giữ chuỗi hôm nay" : "Học ngay để giữ chuỗi"}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums transition-colors",
              studiedToday
                ? "bg-orange-500/10 text-orange-500"
                : "text-muted-foreground"
            )}
          >
            <Flame className={cn("h-4 w-4", studiedToday && "fill-orange-500/30")} />
            {streak}
          </span>
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-sm tabular-nums text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatDuration(todaySeconds)}
          </span>
        </div>
      </div>
    </header>
  );
}