// components/DeckToolbar.tsx
import { ChevronsDownUp, ChevronsUpDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  showToggleAll: boolean;
  allOpen: boolean;
  onToggleAll: () => void;
}

export function DeckToolbar({ query, onQueryChange, showToggleAll, allOpen, onToggleAll }: Props) {
  const toggleLabel = allOpen ? "Thu gọn tất cả" : "Mở rộng tất cả";

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && query) {
              e.preventDefault();
              onQueryChange("");
            }
          }}
          placeholder="Tìm deck…"
          aria-label="Tìm deck"
          autoComplete="off"
          className="h-10 w-full rounded-xl border bg-background pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Xoá tìm kiếm"
            className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {showToggleAll && (
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleAll}
          aria-label={toggleLabel}
          title={toggleLabel}
          className="size-10 shrink-0 rounded-xl"
        >
          {allOpen ? <ChevronsDownUp className="size-4" /> : <ChevronsUpDown className="size-4" />}
        </Button>
      )}
    </div>
  );
}