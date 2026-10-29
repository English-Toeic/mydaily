// lib/vocab.ts
import type { Deck } from "@/types/vocab";

export function computeVocabStats(decks: Deck[]) {
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
}