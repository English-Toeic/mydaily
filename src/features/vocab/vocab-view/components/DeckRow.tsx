// components/DeckRow.tsx
import { BookOpen, ChevronRight, Folder, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Deck } from "@/types/vocab";
import { isAllLearned, type Counts } from "../lib/counts";
import { ACTION_COL, COL, STATUS } from "../ui";
import { DeckBar } from "./DeckBar";
import { deckRowId } from "./deckRowUtils";

const INDENT_PX = 20;
const BASE_PX = 12;

interface Props {
  deck: Deck;
  depth: number;
  counts: Counts;
  hasKids: boolean;
  /** `undefined` = dòng không mở/đóng được (vd. trong kết quả tìm kiếm) */
  isOpen?: boolean;
  /** Đường dẫn deck cha, chỉ hiện trong kết quả tìm kiếm */
  path?: string;
  /** Có thì vùng tên là nút bấm (mở/đóng hoặc "đi tới deck") */
  onSelect?: () => void;
  onStudy: () => void;
}

export function DeckRow({ deck, depth, counts, hasKids, isOpen, path, onSelect, onStudy }: Props) {
  const FolderIcon = hasKids ? (isOpen ? FolderOpen : Folder) : BookOpen;
  const allLearned = isAllLearned(counts);

  const label = (
    <>
      <ChevronRight
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform",
          isOpen && "rotate-90",
          !hasKids && "invisible"
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <FolderIcon
            aria-hidden="true"
            className={cn("size-4 shrink-0", hasKids ? "text-amber-500" : "text-muted-foreground")}
          />
          <span className="truncate font-medium">{deck.name}</span>
        </span>
        {path && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{path}</span>}
        <DeckBar counts={counts} className="mt-1.5 h-1 max-w-40" />
      </span>
    </>
  );

  return (
    <div
      id={deckRowId(deck.id)}
      tabIndex={-1}
      className="flex items-center gap-2 py-2.5 pr-3 outline-none transition hover:bg-muted/40 focus:bg-primary/5 sm:pr-4"
      style={{ paddingLeft: BASE_PX + depth * INDENT_PX }}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {label}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">{label}</div>
      )}

      {STATUS.map((s) => (
        <Count key={s.key} value={counts[s.key]} className={s.text} />
      ))}

      <div className={cn(ACTION_COL, "flex justify-end")}>
        {!hasKids && counts.total > 0 && (
          <Button
            size="sm"
            variant={allLearned ? "outline" : "default"}
            onClick={onStudy}
            aria-label={`${allLearned ? "Ôn" : "Học"} ${deck.name}`}
            className="h-8 rounded-lg px-3"
          >
            {allLearned ? "Ôn" : "Học"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Count({ value, className }: { value: number; className: string }) {
  return (
    <span
      className={cn(
        COL,
        "text-sm font-medium tabular-nums",
        value === 0 ? "text-muted-foreground/40" : className
      )}
    >
      {value}
    </span>
  );
}