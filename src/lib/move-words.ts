import type { Deck, Word } from "@/types/vocab";
import { normalizeText } from "@/lib/vocab-search";

export interface MovePlan {
  /** Không trùng, chuyển được ngay */
  fresh: Word[];
  /** Trùng với deck đích hoặc trùng nhau trong nhóm đang chọn */
  duplicates: Word[];
  /** Đã nằm trong deck đích, luôn bỏ qua */
  alreadyThere: number;
}

export function planMove(words: Word[], target: Deck): MovePlan {
  const taken = new Set(target.words.map((w) => normalizeText(w.english)));
  const fresh: Word[] = [];
  const duplicates: Word[] = [];
  let alreadyThere = 0;

  for (const w of words) {
    if (w.deck_id === target.id) {
      alreadyThere++;
      continue;
    }
    const key = normalizeText(w.english);
    if (taken.has(key)) {
      duplicates.push(w);
    } else {
      taken.add(key);
      fresh.push(w);
    }
  }

  return { fresh, duplicates, alreadyThere };
}