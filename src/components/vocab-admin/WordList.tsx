import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Word } from "@/types/vocab";
import { SENTENCE_COUNT } from "@/lib/sentences";
import { sentenceCount, type WordHit } from "@/lib/vocab-search";
import { Highlight } from "./Highlight";

interface WordListProps {
  hits: WordHit[];
  tokens: string[];
  showDeckName: boolean;
  editingId: number | null;
  emptyMessage: string;
  onEdit: (hit: WordHit) => void;
  onDelete: (word: Word) => void;
}

export function WordList({
  hits,
  tokens,
  showDeckName,
  editingId,
  emptyMessage,
  onEdit,
  onDelete,
}: WordListProps) {
  if (hits.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="divide-y">
      {hits.map((hit) => (
        <WordRow
          key={hit.word.id}
          hit={hit}
          tokens={tokens}
          showDeckName={showDeckName}
          isEditing={editingId === hit.word.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface WordRowProps {
  hit: WordHit;
  tokens: string[];
  showDeckName: boolean;
  isEditing: boolean;
  onEdit: (hit: WordHit) => void;
  onDelete: (word: Word) => void;
}

function WordRow({ hit, tokens, showDeckName, isEditing, onEdit, onDelete }: WordRowProps) {
  const { word, deck, sentenceHit } = hit;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 py-2",
        isEditing && "bg-accent/50 -mx-2 px-2 rounded-md"
      )}
    >
      <div className="min-w-0">
        <div>
          <span className="font-medium">
            <Highlight text={word.english} tokens={tokens} />
          </span>
          {word.ipa && (
            <span className="text-xs text-muted-foreground ml-2">
              <Highlight text={word.ipa} tokens={tokens} />
            </span>
          )}
          <span className="text-sm text-muted-foreground ml-2">
            — <Highlight text={word.meaning} tokens={tokens} />
          </span>
          <SentenceBadge count={sentenceCount(word)} />
          {showDeckName && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-md ml-2 align-middle border text-muted-foreground">
              {deck.name}
            </span>
          )}
        </div>
        {sentenceHit && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            ↳ <Highlight text={sentenceHit} tokens={tokens} />
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(hit)}
          className="text-muted-foreground hover:text-foreground p-1.5"
          aria-label={`Sửa ${word.english}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(word)}
          className="text-muted-foreground hover:text-destructive p-1.5"
          aria-label={`Xóa ${word.english}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SentenceBadge({ count }: { count: number }) {
  return (
    <span
      className={cn(
        "text-[11px] px-1.5 py-0.5 rounded-md ml-2 align-middle",
        count >= SENTENCE_COUNT
          ? "bg-success/15 text-success"
          : count > 0
          ? "bg-reward/25 text-reward-foreground dark:text-reward"
          : "bg-muted text-muted-foreground"
      )}
    >
      {count}/{SENTENCE_COUNT} câu
    </span>
  );
}