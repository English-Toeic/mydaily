import { useState } from "react";
import { ArrowLeft, BookOpen, Headphones, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Deck } from "@/types/vocab";
import type { Passage, PassageKind, PassageMode } from "@/types/passage";
import { PASSAGE_KIND_LABEL } from "@/types/passage";
import { speakersOf } from "@/lib/passage-parse";

interface Props {
  deck: Deck;
  /** Bài của deck này */
  passages: Passage[];
  initialKind: PassageKind;
  onBack: () => void;
  onStudyWords: () => void;
  onOpen: (passage: Passage, mode: PassageMode) => void;
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hôm nay";
  if (days === 1) return "hôm qua";
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function PassageListView({ deck, passages, initialKind, onBack, onStudyWords, onOpen }: Props) {
  const [kind, setKind] = useState<PassageKind>(initialKind);
  const list = passages.filter((p) => p.kind === kind);
  const countOf = (k: PassageKind) => passages.filter((p) => p.kind === k).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="truncate text-lg font-semibold">{deck.name}</h1>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={onStudyWords}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <BookOpen className="size-4" />
          Từ vựng ({deck.words.length})
        </button>
        {(["dialogue", "speech"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
              kind === k ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {PASSAGE_KIND_LABEL[k]} ({countOf(k)})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Deck này chưa có {PASSAGE_KIND_LABEL[kind].toLowerCase()} nào. Thêm trong trang Quản lý từ vựng.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((p) => {
            const speakers = speakersOf(p.lines);
            return (
              <li key={p.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.lines.length} {kind === "dialogue" ? "lượt" : "câu"}
                      {speakers.length > 0 && ` · ${speakers.join(", ")}`}
                      {p.last_practiced_at && ` · Luyện ${timeAgo(p.last_practiced_at)}`}
                    </p>
                  </div>
                  {p.best_score !== null && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                        p.best_score >= 80
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : p.best_score >= 50
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-red-500/15 text-red-700 dark:text-red-400"
                      )}
                    >
                      {p.best_score}%
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onOpen(p, "read")}>
                    <Headphones className="size-4" />
                    Đọc & nghe
                  </Button>
                  <Button size="sm" onClick={() => onOpen(p, "write")}>
                    <PenLine className="size-4" />
                    {kind === "dialogue" ? "Nhập vai" : "Viết"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}