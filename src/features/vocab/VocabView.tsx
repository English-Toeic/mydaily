import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle, ArrowLeft, BookOpen, ChevronRight, ChevronsDownUp, ChevronsUpDown,
  Folder, FolderOpen, Plus, RefreshCw, Search, Settings, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

type Counts = { fresh: number; learning: number; learned: number; total: number };

const EXPANDED_KEY = "vocab:expanded";
const ZERO: Counts = { fresh: 0, learning: 0, learned: 0, total: 0 };

const add = (a: Counts, b: Counts): Counts => ({
  fresh: a.fresh + b.fresh,
  learning: a.learning + b.learning,
  learned: a.learned + b.learned,
  total: a.total + b.total,
});

/** So khớp không phân biệt dấu: "tu vung" khớp "Từ vựng" */
const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

/** Dựng cây và đếm số từ một lần, thay vì đệ quy lại mỗi lần render */
function useDeckTree(decks: Deck[]) {
  return useMemo(() => {
    const byId = new Map(decks.map((d) => [d.id, d]));
    const children = new Map<number | null, Deck[]>();
    for (const d of decks) {
      const list = children.get(d.parent_id) ?? [];
      list.push(d);
      children.set(d.parent_id, list);
    }

    const counts = new Map<number, Counts>();
    const visit = (d: Deck): Counts => {
      const cached = counts.get(d.id);
      if (cached) return cached;
      let c: Counts = { ...ZERO };
      for (const w of d.words) {
        if (w.status === "new") c.fresh++;
        else if (w.status === "learning") c.learning++;
        else c.learned++;
        c.total++;
      }
      for (const k of children.get(d.id) ?? []) c = add(c, visit(k));
      counts.set(d.id, c);
      return c;
    };
    decks.forEach(visit);

    const roots = children.get(null) ?? [];
    const summary = roots.reduce((acc, r) => add(acc, counts.get(r.id)!), ZERO);
    const parentIds = decks.filter((d) => children.has(d.id)).map((d) => d.id);

    return { byId, children, counts, roots, summary, parentIds };
  }, [decks]);
}

function usePersistentSet(key: string) {
  const [set, setSet] = useState<Set<number>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) ?? "[]"));
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify([...set]));
  }, [key, set]);
  return [set, setSet] as const;
}

export function VocabView({ decks, loading, error, onBack, onRefetch, onStudy, onAdmin }: Props) {
  const tree = useDeckTree(decks);
  const [expanded, setExpanded] = usePersistentSet(EXPANDED_KEY);
  const [query, setQuery] = useState("");
  const q = fold(query.trim());

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOpen = tree.parentIds.length > 0 && tree.parentIds.every((id) => expanded.has(id));
  const toggleAll = () => setExpanded(allOpen ? new Set() : new Set(tree.parentIds));

  const results = useMemo(
    () => (q ? decks.filter((d) => fold(d.name).includes(q)) : []),
    [decks, q]
  );

  const pathOf = (d: Deck) => {
    const names: string[] = [];
    let p = d.parent_id;
    for (let guard = 0; p !== null && guard < 20; guard++) {
      const parent = tree.byId.get(p);
      if (!parent) break;
      names.unshift(parent.name);
      p = parent.parent_id;
    }
    return names.join(" / ");
  };

  const renderTree = (deck: Deck, depth: number): ReactNode => {
    const kids = tree.children.get(deck.id) ?? [];
    const isOpen = expanded.has(deck.id);
    return (
      <li key={deck.id}>
        <DeckRow
          deck={deck}
          depth={depth}
          counts={tree.counts.get(deck.id) ?? ZERO}
          hasKids={kids.length > 0}
          isOpen={isOpen}
          onToggle={() => toggle(deck.id)}
          onStudy={() => onStudy(deck.id)}
        />
        {kids.length > 0 && isOpen && <ul>{kids.map((k) => renderTree(k, depth + 1))}</ul>}
      </li>
    );
  };

  const { summary } = tree;
  const learnedPct = summary.total ? Math.round((summary.learned / summary.total) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-4 sm:py-8">
      {/* Header */}
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại" className="shrink-0 rounded-full">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight">Từ vựng</h1>
          {!loading && !error && (
            <p className="text-xs text-muted-foreground">
              {decks.length} deck · {summary.total} từ
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onAdmin} aria-label="Quản lý" className="gap-2 rounded-full">
          <Settings className="size-4" />
          <span className="hidden sm:inline">Quản lý</span>
        </Button>
      </header>

      {loading && <LoadingSkeleton />}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-red-500/10">
            <AlertCircle className="size-6 text-red-500" />
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={onRefetch} className="rounded-full">
            <RefreshCw className="size-4" /> Thử lại
          </Button>
        </div>
      )}

      {!loading && !error && decks.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-primary/10">
            <BookOpen className="size-6 text-primary" />
          </div>
          <p className="font-medium">Chưa có deck nào</p>
          <p className="text-sm text-muted-foreground">Tạo deck đầu tiên để bắt đầu học từ vựng.</p>
          <Button size="sm" onClick={onAdmin} className="mt-1 rounded-full">
            <Plus className="size-4" /> Tạo deck
          </Button>
        </div>
      )}

      {!loading && !error && decks.length > 0 && (
        <>
          {/* Tổng quan */}
          <section className="rounded-2xl border bg-linear-to-br from-primary/6 to-transparent p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tiến độ tổng</p>
                <p className="text-3xl font-bold tabular-nums tracking-tight">{learnedPct}%</p>
              </div>
              <div className="flex gap-4 text-right">
                <Legend label="Mới" value={summary.fresh} dot="bg-blue-500" />
                <Legend label="Đang học" value={summary.learning} dot="bg-orange-500" />
                <Legend label="Đã thuộc" value={summary.learned} dot="bg-emerald-500" />
              </div>
            </div>
            <DeckBar counts={summary} className="mt-3 h-2.5" />
          </section>

          {/* Tìm kiếm */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm deck…"
                aria-label="Tìm deck"
                className="h-10 w-full rounded-xl border bg-background pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Xoá tìm kiếm"
                  className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            {!q && tree.parentIds.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAll}
                aria-label={allOpen ? "Thu gọn tất cả" : "Mở rộng tất cả"}
                title={allOpen ? "Thu gọn tất cả" : "Mở rộng tất cả"}
                className="shrink-0 rounded-xl text-muted-foreground"
              >
                {allOpen ? <ChevronsDownUp className="size-4" /> : <ChevronsUpDown className="size-4" />}
              </Button>
            )}
          </div>

          {/* Danh sách */}
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center gap-1 border-b bg-muted/40 py-2 pl-4 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="flex-1">Deck</span>
              <span className="w-10 text-center text-blue-600 dark:text-blue-400 sm:w-12">Mới</span>
              <span className="w-10 text-center text-orange-600 dark:text-orange-400 sm:w-12">Học</span>
              <span className="w-10 text-center text-emerald-600 dark:text-emerald-400 sm:w-12">Thuộc</span>
              <span className="w-14" />
            </div>

            <ul className="p-1.5">
              {q
                ? results.map((d) => (
                    <li key={d.id}>
                      <DeckRow
                        deck={d}
                        depth={0}
                        path={pathOf(d)}
                        counts={tree.counts.get(d.id) ?? ZERO}
                        hasKids={tree.children.has(d.id)}
                        isOpen={false}
                        onToggle={() => {
                          // Từ kết quả tìm kiếm: mở deck cha trong cây
                          setQuery("");
                          setExpanded((p) => new Set(p).add(d.id));
                        }}
                        onStudy={() => onStudy(d.id)}
                      />
                    </li>
                  ))
                : tree.roots.map((d) => renderTree(d, 0))}
            </ul>

            {q && results.length === 0 && (
              <p className="pb-8 pt-4 text-center text-sm text-muted-foreground">
                Không tìm thấy deck “{query}”
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Các component nhỏ ---------- */

function DeckRow({
  deck, depth, counts, hasKids, isOpen, path, onToggle, onStudy,
}: {
  deck: Deck;
  depth: number;
  counts: Counts;
  hasKids: boolean;
  isOpen: boolean;
  path?: string;
  onToggle: () => void;
  onStudy: () => void;
}) {
  const FolderIcon = hasKids ? (isOpen ? FolderOpen : Folder) : BookOpen;
  const allLearned = counts.total > 0 && counts.learned === counts.total;

  return (
    <div
      className="group flex items-center gap-1 rounded-xl pr-1 transition-colors hover:bg-muted/60"
      style={{ paddingLeft: 4 + depth * 16 }}
    >
      {hasKids ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Thu gọn ${deck.name}` : `Mở ${deck.name}`}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className={cn("size-4 transition-transform duration-200", isOpen && "rotate-90")} />
        </button>
      ) : (
        <span className="size-7 shrink-0" />
      )}

      <button
        type="button"
        onClick={hasKids ? onToggle : onStudy}
        className="flex min-w-0 flex-1 flex-col gap-1.5 rounded-lg py-2.5 pr-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span className="flex min-w-0 items-center gap-2">
          <FolderIcon className={cn("size-4 shrink-0", hasKids ? "text-amber-500" : "text-primary/70")} />
          <span className="truncate font-medium">{deck.name}</span>
        </span>
        {path && <span className="truncate pl-6 text-xs text-muted-foreground">{path}</span>}
        <DeckBar counts={counts} className="ml-6 h-1.5" />
      </button>

      <Count value={counts.fresh} className="text-blue-600 dark:text-blue-400" />
      <Count value={counts.learning} className="text-orange-600 dark:text-orange-400" />
      <Count value={counts.learned} className="text-emerald-600 dark:text-emerald-400" />

      <div className="flex w-14 justify-end">
        {!hasKids && counts.total > 0 && (
          <Button
            size="sm"
            variant={allLearned ? "ghost" : "secondary"}
            onClick={onStudy}
            // Mobile không có hover nên luôn hiện. Desktop hiện khi hover hoặc focus
            className="h-8 rounded-lg px-3 transition-opacity sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
          >
            {allLearned ? "Ôn" : "Học"}
          </Button>
        )}
      </div>
    </div>
  );
}

function DeckBar({ counts, className }: { counts: Counts; className?: string }) {
  const pct = (n: number) => (counts.total ? (n / counts.total) * 100 : 0);
  return (
    <div className={cn("flex overflow-hidden rounded-full bg-muted", className)}>
      <div className="bg-emerald-500 transition-[width] duration-500" style={{ width: `${pct(counts.learned)}%` }} />
      <div className="bg-orange-400 transition-[width] duration-500" style={{ width: `${pct(counts.learning)}%` }} />
      <div className="bg-blue-400/50 transition-[width] duration-500" style={{ width: `${pct(counts.fresh)}%` }} />
    </div>
  );
}

function Count({ value, className }: { value: number; className: string }) {
  return (
    <span
      className={cn(
        "w-10 shrink-0 text-center text-sm font-semibold tabular-nums sm:w-12",
        value === 0 ? "text-muted-foreground/30" : className
      )}
    >
      {value}
    </span>
  );
}

function Legend({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div>
      <p className="text-base font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
        <span className={cn("size-1.5 rounded-full", dot)} /> {label}
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Đang tải">
      <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      <div className="h-10 animate-pulse rounded-xl bg-muted" />
      <div className="space-y-2 rounded-2xl border p-3">
        {[70, 55, 80, 45, 60].map((w, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="size-4 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
              <div className="h-1.5 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}