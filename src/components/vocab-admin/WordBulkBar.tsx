import { useEffect, useMemo, useRef, useState } from "react";
import { FolderInput, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types/vocab";
import { flattenDeckTree } from "@/lib/deck-tree";
import type { MovePlan } from "@/lib/move-words";

interface Props {
  decks: Deck[];
  selectedCount: number;
  visibleCount: number;
  visibleSelectedCount: number;
  /** Các deck đang chứa từ được chọn */
  sourceDeckIds: Set<number>;
  busy: boolean;
  planFor: (targetId: number) => MovePlan | null;
  onToggleAllVisible: () => void;
  onClear: () => void;
  onMove: (targetId: number, skipDuplicates: boolean) => Promise<boolean>;
}

const INDENT = "\u00A0\u00A0\u00A0";

export function WordBulkBar({
  decks, selectedCount, visibleCount, visibleSelectedCount, sourceDeckIds,
  busy, planFor, onToggleAllVisible, onClear, onMove,
}: Props) {
  const options = useMemo(() => flattenDeckTree(decks), [decks]);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const checkRef = useRef<HTMLInputElement>(null);

  const allVisible = visibleCount > 0 && visibleSelectedCount === visibleCount;
  const someVisible = visibleSelectedCount > 0 && !allVisible;

  useEffect(() => {
    if (checkRef.current) checkRef.current.indeterminate = someVisible;
  }, [someVisible]);

  // Deck đích bị xoá thì coi như chưa chọn
  const target = targetId !== null && decks.some((d) => d.id === targetId) ? targetId : null;
  const plan = target !== null && selectedCount > 0 ? planFor(target) : null;
  const moveCount = plan
    ? plan.fresh.length + (skipDuplicates ? 0 : plan.duplicates.length)
    : 0;

  const handleMove = async () => {
    if (target === null || moveCount === 0) return;
    const ok = await onMove(target, skipDuplicates);
    if (ok) setTargetId(null);
  };

  if (visibleCount === 0 && selectedCount === 0) return null;

  const dupPreview = plan?.duplicates
    .slice(0, 3)
    .map((w) => w.english)
    .join(", ");

  return (
    <div className="sticky top-2 z-10 mb-3 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer select-none items-center gap-2 px-1 text-sm">
          <input
            ref={checkRef}
            type="checkbox"
            checked={allVisible}
            disabled={visibleCount === 0}
            onChange={onToggleAllVisible}
            className="size-4 accent-primary"
          />
          {selectedCount > 0 ? (
            <span>
              <b className="tabular-nums">{selectedCount}</b> đã chọn
            </span>
          ) : (
            <span className="text-muted-foreground">Chọn tất cả ({visibleCount})</span>
          )}
        </label>

        {selectedCount > 0 && (
          <>
            <Button size="sm" variant="ghost" onClick={onClear}>
              <X className="mr-1 h-4 w-4" />
              Bỏ chọn
            </Button>

            <div className="ml-auto flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
              <select
                value={target ?? ""}
                onChange={(e) => setTargetId(e.target.value ? Number(e.target.value) : null)}
                aria-label="Deck đích"
                className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm sm:w-60"
              >
                <option value="">Chuyển tới deck…</option>
                {options.map(({ deck, depth }) => (
                  <option
                    key={deck.id}
                    value={deck.id}
                    disabled={sourceDeckIds.size === 1 && sourceDeckIds.has(deck.id)}
                  >
                    {INDENT.repeat(depth)}
                    {depth > 0 ? "└ " : ""}
                    {deck.name} ({deck.words.length})
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                disabled={busy || moveCount === 0}
                onClick={() => void handleMove()}
              >
                {busy ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <FolderInput className="mr-1 h-4 w-4" />
                )}
                Chuyển{moveCount > 0 ? ` ${moveCount}` : ""}
              </Button>
            </div>
          </>
        )}
      </div>

      {plan && (plan.duplicates.length > 0 || plan.alreadyThere > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
          {plan.alreadyThere > 0 && (
            <span>{plan.alreadyThere} từ đã nằm trong deck này, sẽ bỏ qua</span>
          )}
          {plan.duplicates.length > 0 && (
            <label className="flex cursor-pointer items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="size-3.5 accent-amber-500"
              />
              Bỏ qua {plan.duplicates.length} từ trùng
              <span className="truncate opacity-80">
                ({dupPreview}
                {plan.duplicates.length > 3 ? ", …" : ""})
              </span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}