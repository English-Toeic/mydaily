// components/activity-chart/BarTooltip.tsx
import { cn } from "@/lib/utils";
import type { BarTone } from "../../lib/chart";
import type { BarParts } from "../../lib/aggregate";
import { SEGMENTS } from "../../lib/segments";
import { fmtShort } from "../../lib/format";

const TONE: Record<BarTone, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  warn: "text-orange-600 dark:text-orange-400",
  muted: "text-muted-foreground",
};

interface Props {
  index: number;
  count: number;
  /** Chiều cao cột theo % vùng vẽ */
  heightPct: number;
  title: string;
  seconds: number;
  parts: BarParts;
  status: { text: string; tone: BarTone };
}

export function BarTooltip({ index, count, heightPct, title, seconds, parts, status }: Props) {
  const pos = (index + 0.5) / count;
  // Cột ở mép thì lệch tooltip vào trong để không bị cắt
  const shift = pos < 0.2 ? -15 : pos > 0.8 ? -85 : -50;
  const rows = SEGMENTS.filter((s) => parts[s.key] > 0);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-20 w-max max-w-53 rounded-lg border bg-popover px-2.5 py-1.5 text-popover-foreground shadow-md motion-safe:animate-in motion-safe:fade-in-0"
      style={{
        left: `${pos * 100}%`,
        bottom: `calc(${Math.min(heightPct, 70)}% + 8px)`,
        transform: `translateX(${shift}%)`,
      }}
    >
      <p className="text-[11px] text-muted-foreground">{title}</p>
      <p className="text-sm font-semibold tabular-nums">{fmtShort(seconds)}</p>

      {rows.length > 0 && (
        <ul className="my-1 space-y-0.5">
          {rows.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-[11px]">
              <span className={cn("size-2 shrink-0 rounded-full", s.bar)} />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="ml-auto pl-3 font-medium tabular-nums">{fmtShort(parts[s.key])}</span>
            </li>
          ))}
        </ul>
      )}

      <p className={cn("text-[11px] font-medium", TONE[status.tone])}>{status.text}</p>
    </div>
  );
}