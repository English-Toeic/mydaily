import { useMemo, useState } from "react";
import type { Deck } from "@/types/vocab";
import { ancestorsOf, buildDeckTree } from "./lib/tree";
import { searchDecks } from "./lib/search";
import { useExpanded } from "./hooks/useExpanded";
import { VocabHeader } from "./components/VocabHeader";
import { EmptyState, ErrorState, LoadingSkeleton } from "./components/VocabStates";
import { ProgressSummary } from "./components/ProgressSummary";
import { DeckToolbar } from "./components/DeckToolbar";
import { DeckList } from "./components/DeckList";
import { deckRowId } from "./components/deckRowUtils";

interface Props {
  decks: Deck[];
  loading: boolean;
  error: string | null;
  passageCounts: Map<number, number>;
  onBack: () => void;
  onRefetch: () => void;
  onStudy: (deckId: number) => void;
  onAdmin: () => void;
  onOpenPassages: (deckId: number) => void;

}

export function VocabView({ decks, loading, error, passageCounts, onBack, onRefetch, onStudy, onAdmin, onOpenPassages }: Props) {
  const tree = useMemo(() => buildDeckTree(decks), [decks]);
  const { expanded, allOpen, toggle, toggleAll, expandMany } = useExpanded(tree.parentIds);
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDecks(decks, query), [decks, query]);

  const ready = !loading && !error;

  // Từ kết quả tìm kiếm: mở cả nhánh chứa deck rồi đưa focus tới dòng đó
  const reveal = (id: number) => {
    setQuery("");
    const ids = ancestorsOf(tree, id);
    if (tree.children.has(id)) ids.push(id);
    expandMany(ids);
    requestAnimationFrame(() => {
      const el = document.getElementById(deckRowId(id));
      el?.focus();
      el?.scrollIntoView({ block: "nearest" });
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <VocabHeader
        subtitle={ready ? `${decks.length} deck · ${tree.summary.total} từ` : undefined}
        onBack={onBack}
        onAdmin={onAdmin}
      />

      {loading && <LoadingSkeleton />}
      {error && !loading && <ErrorState message={error} onRetry={onRefetch} />}
      {ready && decks.length === 0 && <EmptyState onCreate={onAdmin} />}

      {ready && decks.length > 0 && (
        <div className="flex flex-col gap-4">
          <ProgressSummary counts={tree.summary} />
          <DeckToolbar
            query={query}
            onQueryChange={setQuery}
            showToggleAll={!results && tree.parentIds.length > 0}
            allOpen={allOpen}
            onToggleAll={toggleAll}
          />
          <DeckList
            tree={tree}
            expanded={expanded}
            query={query}
            results={results}
            passageCounts={passageCounts}
            onToggle={toggle}
            onReveal={reveal}
            onStudy={onStudy}
            onOpenPassages={onOpenPassages}
          />
        </div>
      )}
    </div>
  );
}