import { useMemo, useState } from "react";
import { Check, FolderPlus, Pencil, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Deck } from "@/types/vocab";
import { flattenDeckTree } from "@/lib/deck-tree";
import { normalizeText } from "@/lib/vocab-search";
import { inputCls } from "./styles";

interface DeckSidebarProps {
  decks: Deck[];
  selectedId: number | null;
  busy: boolean;
  onSelect: (id: number) => void;
  onRename: (id: number, name: string) => Promise<boolean>;
  onAdd: (name: string, parentId: number | null) => Promise<boolean>;
}

export function DeckSidebar({
  decks,
  selectedId,
  busy,
  onSelect,
  onRename,
  onAdd,
}: DeckSidebarProps) {
  const [filter, setFilter] = useState("");
  const nodes = useMemo(() => flattenDeckTree(decks), [decks]);

  const visibleNodes = useMemo(() => {
    const q = normalizeText(filter.trim());
    if (!q) return nodes;
    return nodes.filter((n) => normalizeText(n.deck.name).includes(q));
  }, [nodes, filter]);

  return (
    <aside className="border rounded-xl p-3 space-y-3 h-fit md:sticky md:top-4">
      <p className="text-sm font-medium text-muted-foreground">
        Decks <span className="font-normal">({decks.length})</span>
      </p>

      {decks.length > 5 && (
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Lọc deck…"
            className={cn(inputCls, "w-full pl-7 py-1")}
          />
        </div>
      )}

      <div className="space-y-1 max-h-[50vh] overflow-y-auto">
        {visibleNodes.map(({ deck, depth }) => (
          <DeckRow
            key={deck.id}
            deck={deck}
            depth={depth}
            selected={deck.id === selectedId}
            busy={busy}
            onSelect={onSelect}
            onRename={onRename}
          />
        ))}
        {decks.length === 0 && (
          <p className="text-xs text-muted-foreground">Chưa có deck</p>
        )}
        {decks.length > 0 && visibleNodes.length === 0 && (
          <p className="text-xs text-muted-foreground">Không tìm thấy deck</p>
        )}
      </div>

      <AddDeckForm decks={decks} busy={busy} onAdd={onAdd} />
    </aside>
  );
}

// ---------------------------------------------------------------------------

interface DeckRowProps {
  deck: Deck;
  depth: number;
  selected: boolean;
  busy: boolean;
  onSelect: (id: number) => void;
  onRename: (id: number, name: string) => Promise<boolean>;
}

function DeckRow({ deck, depth, selected, busy, onSelect, onRename }: DeckRowProps) {
  const [renaming, setRenaming] = useState(false);
  const [value, setValue] = useState(deck.name);

  const submit = async () => {
    const name = value.trim();
    if (!name || name === deck.name) {
      setRenaming(false);
      return;
    }
    if (await onRename(deck.id, name)) setRenaming(false);
  };

  if (renaming) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={value}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
            if (e.key === "Escape") setRenaming(false);
          }}
          className={cn(inputCls, "flex-1 py-1 min-w-0")}
        />
        <button onClick={() => void submit()} disabled={busy} className="text-success p-1" aria-label="Lưu tên">
          <Check className="h-4 w-4" />
        </button>
        <button onClick={() => setRenaming(false)} className="text-muted-foreground p-1" aria-label="Hủy">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-1">
      <button
        onClick={() => onSelect(deck.id)}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        className={cn(
          "flex-1 min-w-0 text-left pr-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2",
          selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        )}
      >
        <span className="truncate">
          {depth > 0 && <span className="opacity-50">└ </span>}
          {deck.name}
        </span>
        <span className="text-xs opacity-70 shrink-0">{deck.words.length}</span>
      </button>
      <button
        onClick={() => {
          setValue(deck.name);
          setRenaming(true);
        }}
        className="text-muted-foreground hover:text-foreground p-1 opacity-60 group-hover:opacity-100"
        aria-label={`Đổi tên ${deck.name}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface AddDeckFormProps {
  decks: Deck[];
  busy: boolean;
  onAdd: (name: string, parentId: number | null) => Promise<boolean>;
}

function AddDeckForm({ decks, busy, onAdd }: AddDeckFormProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const rootDecks = useMemo(() => decks.filter((d) => d.parent_id === null), [decks]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (await onAdd(name.trim(), parentId)) {
      setName("");
      setParentId(null);
    }
  };

  return (
    <form onSubmit={submit} className="pt-3 border-t space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Thêm deck</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên deck"
        className={cn(inputCls, "w-full")}
      />
      <select
        value={parentId ?? ""}
        onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
        className={cn(inputCls, "w-full")}
      >
        <option value="">— Deck gốc —</option>
        {rootDecks.map((d) => (
          <option key={d.id} value={d.id}>
            Con của: {d.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" className="w-full" disabled={busy || !name.trim()}>
        <FolderPlus className="h-4 w-4 mr-1" />
        Thêm deck
      </Button>
    </form>
  );
}