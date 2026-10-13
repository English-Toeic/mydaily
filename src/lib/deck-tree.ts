import type { Deck } from "@/types/vocab";

export interface DeckNode {
  deck: Deck;
  depth: number;
}

/** Sắp xếp deck dạng cây: deck cha đứng trước, các deck con nằm ngay bên dưới. */
export function flattenDeckTree(decks: Deck[]): DeckNode[] {
  const ids = new Set(decks.map((d) => d.id));
  const byParent = new Map<number | null, Deck[]>();

  for (const d of decks) {
    // Nếu deck cha không tồn tại thì coi deck này là deck gốc
    const key = d.parent_id !== null && ids.has(d.parent_id) ? d.parent_id : null;
    const list = byParent.get(key) ?? [];
    list.push(d);
    byParent.set(key, list);
  }

  const result: DeckNode[] = [];
  const visited = new Set<number>();

  const visit = (parentId: number | null, depth: number) => {
    for (const deck of byParent.get(parentId) ?? []) {
      if (visited.has(deck.id)) continue;
      visited.add(deck.id);
      result.push({ deck, depth });
      visit(deck.id, depth + 1);
    }
  };
  visit(null, 0);

  // Phòng trường hợp dữ liệu bị vòng lặp cha-con
  for (const deck of decks) {
    if (!visited.has(deck.id)) result.push({ deck, depth: 0 });
  }
  return result;
}

export function countChildDecks(decks: Deck[], deckId: number): number {
  return decks.filter((d) => d.parent_id === deckId).length;
}