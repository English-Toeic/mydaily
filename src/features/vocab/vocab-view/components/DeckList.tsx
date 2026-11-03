// components/DeckList.tsx
import { cn } from "@/lib/utils";
import type { Deck } from "@/types/vocab";
import { ZERO } from "../lib/counts";
import { pathOf, type DeckTree } from "../lib/tree";
import { ACTION_COL, COL, STATUS } from "../ui";
import { DeckRow } from "./DeckRow";
import { DeckTreeNode } from "./DeckTreeNode";

interface Props {
  tree: DeckTree;
  expanded: Set<number>;
  query: string;
  /** `null` khi không tìm kiếm */
  results: Deck[] | null;
  passageCounts: Map<number, number>;
  onToggle: (id: number) => void;
  onReveal: (id: number) => void;
  onStudy: (id: number) => void;
  onOpenPassages: (deckId: number) => void;
}

export function DeckList({ tree, expanded, query, results, passageCounts, onToggle, onReveal, onStudy, onOpenPassages }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground sm:px-4">
        <span className="flex-1 pl-6">Deck</span>
        {STATUS.map((s) => (
          <span key={s.key} className={cn(COL, s.text)}>
            {s.short}
          </span>
        ))}
        <span className={ACTION_COL} aria-hidden="true" />
      </div>

      <ul className="divide-y">
        {results
          ? results.map((d) => (
              <li key={d.id}>
                <DeckRow
                  deck={d}
                  depth={0}
                  counts={tree.counts.get(d.id) ?? ZERO}
                  hasKids={tree.children.has(d.id)}
                  path={pathOf(tree, d.id) || undefined}
                  onSelect={() => onReveal(d.id)}
                  onStudy={() => onStudy(d.id)}
                  onOpenPassages={() => onOpenPassages(d.id)}
                  passageCount={passageCounts.get(d.id) ?? 0}
                />
              </li>
            ))
          : tree.roots.map((d) => (
              <DeckTreeNode
                key={d.id}
                deck={d}
                depth={0}
                tree={tree}
                expanded={expanded}
                onToggle={onToggle}
                onStudy={onStudy}
                onOpenPassages={onOpenPassages}
                passageCounts={passageCounts}
              />
            ))}
      </ul>

      {results?.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Không tìm thấy deck “{query.trim()}”
        </p>
      )}
    </div>
  );
}