// lib/tree.ts
import type { Deck } from "@/types/vocab";
import { ZERO, addCounts, countWords, type Counts } from "./counts";

export interface DeckTree {
  byId: Map<number, Deck>;
  /** Chỉ chứa liên kết con → cha hợp lệ */
  parentOf: Map<number, number>;
  children: Map<number, Deck[]>;
  counts: Map<number, Counts>;
  roots: Deck[];
  summary: Counts;
  /** Các deck có con, dùng cho "mở rộng tất cả" */
  parentIds: number[];
}

export function buildDeckTree(decks: Deck[]): DeckTree {
  const byId = new Map<number, Deck>(decks.map((d) => [d.id, d]));

  // Đi ngược chuỗi cha: gặp lại id đã thấy nghĩa là có vòng lặp
  const hasCycle = (d: Deck): boolean => {
    const seen = new Set<number>([d.id]);
    let p = d.parent_id;
    while (p !== null) {
      if (seen.has(p)) return true;
      seen.add(p);
      p = byId.get(p)?.parent_id ?? null;
    }
    return false;
  };

  const parentOf = new Map<number, number>();
  const children = new Map<number, Deck[]>();
  const roots: Deck[] = [];

  for (const d of decks) {
    const p = d.parent_id;
    // Cha đã bị xoá hoặc có vòng lặp → coi như gốc, để deck không biến mất
    if (p === null || !byId.has(p) || hasCycle(d)) {
      roots.push(d);
      continue;
    }
    parentOf.set(d.id, p);
    const list = children.get(p);
    if (list) list.push(d);
    else children.set(p, [d]);
  }

  // Cây đã sạch vòng lặp nên đệ quy luôn dừng
  const counts = new Map<number, Counts>();
  const visit = (d: Deck): Counts => {
    let c = countWords(d.words);
    for (const k of children.get(d.id) ?? []) c = addCounts(c, visit(k));
    counts.set(d.id, c);
    return c;
  };
  const summary = roots.reduce<Counts>((acc, r) => addCounts(acc, visit(r)), ZERO);

  return { byId, parentOf, children, counts, roots, summary, parentIds: [...children.keys()] };
}

/** id các deck tổ tiên, từ gốc xuống */
export function ancestorsOf(tree: DeckTree, id: number): number[] {
  const ids: number[] = [];
  let p = tree.parentOf.get(id);
  while (p !== undefined) {
    ids.unshift(p);
    p = tree.parentOf.get(p);
  }
  return ids;
}

export function pathOf(tree: DeckTree, id: number): string {
  return ancestorsOf(tree, id)
    .map((p) => tree.byId.get(p)?.name ?? "")
    .join(" / ");
}