// components/VocabProgress.tsx
import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Deck } from "@/types/vocab";
import { computeVocabStats } from "../lib/vocab";

const SEGMENTS = [
  { key: "learned", dot: "bg-emerald-500", label: "Thuộc" },
  { key: "learning", dot: "bg-orange-400", label: "Đang học" },
  { key: "fresh", dot: "bg-blue-500/60", label: "Mới" },
] as const;

export function VocabProgress({ decks }: { decks: Deck[] }) {
  const stats = useMemo(() => computeVocabStats(decks), [decks]);
  const { learned, total, nearest } = stats;
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
        {SEGMENTS.map((s) => (
          <div
            key={s.key}
            className={cn("transition-all duration-500", s.dot)}
            style={{ width: `${pct(stats[s.key])}%` }}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {SEGMENTS.map((s) => (
          <div key={s.key}>
            <p className="font-semibold tabular-nums">{stats[s.key]}</p>
            <p className="flex items-center gap-1 text-muted-foreground">
              <span className={cn("size-2 rounded-full", s.dot)} />
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {nearest && (
        <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Sắp xong: <b className="text-foreground">“{nearest.name}”</b> còn {nearest.left} từ
        </p>
      )}
    </Card>
  );
}