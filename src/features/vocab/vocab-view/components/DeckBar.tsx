// components/DeckBar.tsx
import { cn } from "@/lib/utils";
import type { Counts } from "../lib/counts";

const SEGMENTS = [
  { key: "learned", color: "bg-emerald-500" },
  { key: "learning", color: "bg-orange-400" },
  { key: "fresh", color: "bg-blue-400/50" },
] as const;

export function DeckBar({ counts, className }: { counts: Counts; className?: string }) {
  const pct = (n: number) => (counts.total ? (n / counts.total) * 100 : 0);

  return (
    <div
      aria-hidden="true"
      className={cn("flex h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      {SEGMENTS.map((s) => (
        <div
          key={s.key}
          className={cn("h-full transition-all", s.color)}
          style={{ width: `${pct(counts[s.key])}%` }}
        />
      ))}
    </div>
  );
}