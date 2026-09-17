import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Deck } from "@/types/vocab";

interface Props {
  decks: Deck[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRefetch: () => void;
  onStudy: (deckId: number) => void;
  onAdmin: () => void;
}

function countDeckSelf(deck: Deck) {
  let n = 0;
  let learn = 0;
  let total = 0;
  for (const w of deck.words) {
    if (w.status === "new") n++;
    else if (w.status === "learning") learn++;
    else total++;
  }
  return { neww: n, learn, total };
}

export function VocabView({
  decks,
  loading,
  error,
  onBack,
  onRefetch,
  onStudy,
  onAdmin
}: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setExpanded((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const roots = useMemo(
    () => decks.filter((d) => d.parent_id === null),
    [decks]
  );
  const childrenOf = (id: number) =>
    decks.filter((d) => d.parent_id === id);

  const countDeep = (
    deck: Deck
  ): { neww: number; learn: number; total: number } => {
    const self = countDeckSelf(deck);
    return childrenOf(deck.id).reduce(
      (acc, c) => {
        const cc = countDeep(c);
        return {
          neww: acc.neww + cc.neww,
          learn: acc.learn + cc.learn,
          total: acc.total + cc.total,
        };
      },
      self
    );
  };

  const renderRow = (deck: Deck, depth = 0) => {
    const kids = childrenOf(deck.id);
    const hasKids = kids.length > 0;
    const isOpen = expanded.has(deck.id);
    const c = countDeep(deck);

    return (
      <div key={deck.id}>
        <div
          style={{ paddingLeft: 12 + depth * 20 }}
          onClick={() => {
            if (hasKids) toggle(deck.id);
            else onStudy(deck.id);
          }}
          className="group flex items-center py-2.5 pr-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasKids ? (
              isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className="truncate">{deck.name}</span>
          </div>

          <Count value={c.neww} color="blue" />
          <Count value={c.learn} color="red" />
          <Count value={c.total} color="green" />

          <div className="w-16 text-right">
            {!hasKids && (
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onStudy(deck.id);
                }}
              >
                Học
              </Button>
            )}
          </div>
        </div>

        {hasKids &&
          isOpen &&
          kids.map((k) => renderRow(k, depth + 1))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Từ vựng</h1>
        <Button variant="outline" onClick={onAdmin} className="gap-2">
          <Settings className="h-4 w-4" />
          Quản lý
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRefetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="border rounded-xl overflow-hidden">
          <div className="flex items-center py-2 pr-3 pl-3 bg-muted/40 text-xs font-medium text-muted-foreground border-b">
            <span className="flex-1">Deck</span>
            <span className="w-10 text-center text-blue-600">New</span>
            <span className="w-10 text-center text-red-500">Learn</span>
            <span className="w-10 text-center text-green-600">Total</span>
            <span className="w-16" />
          </div>

          {roots.map((d) => renderRow(d))}

          {roots.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Chưa có deck nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Count({
  value,
  color,
}: {
  value: number;
  color: "blue" | "red" | "green";
}) {
  const dim = value === 0;
  const colorClass = dim
    ? "text-muted-foreground/40"
    : color === "blue"
    ? "text-blue-600"
    : color === "red"
    ? "text-red-500"
    : "text-green-600";

  return (
    <span className={cn("w-10 text-center text-sm font-medium", colorClass)}>
      {value}
    </span>
  );
}