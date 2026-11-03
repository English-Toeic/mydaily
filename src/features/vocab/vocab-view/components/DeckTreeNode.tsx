// components/DeckTreeNode.tsx
import type { Deck } from "@/types/vocab";
import { ZERO } from "../lib/counts";
import type { DeckTree } from "../lib/tree";
import { DeckRow } from "./DeckRow";

interface Props {
  deck: Deck;
  depth: number;
  tree: DeckTree;
  expanded: Set<number>;
  passageCounts: Map<number, number>;
  onToggle: (id: number) => void;
  onStudy: (id: number) => void;
  onOpenPassages: (deckId: number) => void;
}

export function DeckTreeNode({ deck, depth, tree, expanded, passageCounts, onToggle, onStudy, onOpenPassages }: Props) {
  const kids = tree.children.get(deck.id) ?? [];
  const hasKids = kids.length > 0;
  const isOpen = expanded.has(deck.id);

  return (
    <li>
      <DeckRow
        deck={deck}
        depth={depth}
        counts={tree.counts.get(deck.id) ?? ZERO}
        hasKids={hasKids}
        isOpen={hasKids ? isOpen : undefined}
        onSelect={hasKids ? () => onToggle(deck.id) : undefined}
        onStudy={() => onStudy(deck.id)}
        onOpenPassages={() => onOpenPassages(deck.id)}
        passageCount={passageCounts.get(deck.id) ?? 0}
      />
      {hasKids && isOpen && (
        <ul className="divide-y border-t">
          {kids.map((k) => (
            <DeckTreeNode
              key={k.id}
              deck={k}
              depth={depth + 1}
              tree={tree}
              expanded={expanded}
              onToggle={onToggle}
              onStudy={onStudy}
              onOpenPassages={onOpenPassages}
              passageCounts={passageCounts}
            />
          ))}
        </ul>
      )}
    </li>
  );
}