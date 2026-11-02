// lib/counts.ts
import type { Deck } from "@/types/vocab";

export type Counts = { fresh: number; learning: number; learned: number; total: number };

export const ZERO: Counts = { fresh: 0, learning: 0, learned: 0, total: 0 };

export const addCounts = (a: Counts, b: Counts): Counts => ({
  fresh: a.fresh + b.fresh,
  learning: a.learning + b.learning,
  learned: a.learned + b.learned,
  total: a.total + b.total,
});

export function countWords(words: Deck["words"]): Counts {
  const c = { ...ZERO };
  for (const w of words) {
    if (w.status === "new") c.fresh++;
    else if (w.status === "learning") c.learning++;
    else c.learned++;
    c.total++;
  }
  return c;
}

export const learnedPct = (c: Counts) => (c.total ? Math.round((c.learned / c.total) * 100) : 0);

export const isAllLearned = (c: Counts) => c.total > 0 && c.learned === c.total;