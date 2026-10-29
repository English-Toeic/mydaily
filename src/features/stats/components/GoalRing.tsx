// components/GoalRing.tsx
import { cn } from "@/lib/utils";

const R = 42;
const C = 2 * Math.PI * R;

interface Props {
  /** Tiến độ 0 → 1 */
  pct: number;
  done: boolean;
  /** Vị trí vạch mốc giữ chuỗi (0 → 1), không vẽ nếu ≥ 1 */
  markerPct: number;
  markerReached: boolean;
}

export function GoalRing({ pct, done, markerPct, markerReached }: Props) {
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="10" className="stroke-muted" />
        {pct > 0 && (
          <circle
            cx="50" cy="50" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            className={cn(
              "transition-[stroke-dashoffset] duration-700",
              done ? "stroke-emerald-500" : "stroke-primary"
            )}
          />
        )}
        {markerPct < 1 && (
          <circle
            cx="50" cy="50" r={R} fill="none" strokeWidth="12"
            strokeDasharray={`1.5 ${C}`}
            strokeDashoffset={-C * markerPct}
            className={markerReached ? "stroke-orange-500" : "stroke-foreground/40"}
          />
        )}
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-bold tabular-nums">
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}