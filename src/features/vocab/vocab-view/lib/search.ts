// lib/search.ts
import type { Deck } from "@/types/vocab";

/** So khớp không phân biệt dấu: "tu vung" khớp "Từ vựng" */
export const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

/** `null` nghĩa là không tìm kiếm (ô trống), khác với `[]` là không có kết quả */
export function searchDecks(decks: Deck[], query: string): Deck[] | null {
  const q = fold(query.trim());
  if (!q) return null;
  return decks.filter((d) => fold(d.name).includes(q));
}