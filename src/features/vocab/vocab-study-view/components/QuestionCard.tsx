import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { keepInputFocus } from "@/lib/keepInputFocus";
import type { Word } from "@/types/vocab";
import { hintWords } from "./answer";

interface Props {
  word: Word;
  isViEn: boolean;
  canListen: boolean;
  speaking: boolean;
  onReplay: () => void;
  /** Số ký tự đã gợi ý, 0 = ẩn gợi ý */
  hints: number;
  hintTarget: string;
}

export function QuestionCard({ word, isViEn, canListen, speaking, onReplay, hints, hintTarget }: Props) {
  return (
    <section className="relative rounded-3xl border bg-linear-to-b from-primary/[0.07] via-card to-card px-6 pb-8 pt-10 text-center shadow-sm">
      <StatusPill status={word.status} className="absolute left-4 top-4" />

      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {isViEn ? "Từ tiếng Anh là gì?" : "Nghĩa tiếng Việt là gì?"}
      </p>
      <p
        lang={isViEn ? "vi" : "en"}
        className="mt-3 wrap-break-word text-3xl font-bold tracking-tight sm:text-4xl"
      >
        {isViEn ? word.meaning : word.english}
      </p>

      {canListen && (
        <button
          type="button"
          {...keepInputFocus}
          onClick={onReplay}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border transition hover:text-foreground active:scale-95 touch-manipulation"
        >
          <Volume2 className={cn("size-4", speaking && "animate-pulse text-primary")} />
          {word.ipa ? <span className="font-mono">{word.ipa}</span> : "Nghe"}
        </button>
      )}

      {hints > 0 && <HintMask target={hintTarget} revealed={hints} />}
    </section>
  );
}

/* ---------- */

const STATUS_STYLE: Record<Word["status"], { label: string; className: string }> = {
  new: { label: "Mới", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  learning: { label: "Đang học", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  learned: { label: "Đã thuộc", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

function StatusPill({ status, className }: { status: Word["status"]; className?: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.new;
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", s.className, className)}>
      {s.label}
    </span>
  );
}

function HintMask({ target, revealed }: { target: string; revealed: number }) {
  const words = hintWords(target, revealed);
  // Screen reader đọc chuỗi này thay vì từng ô trống
  const spoken = words.map((w) => w.map((ch) => ch ?? "_").join("")).join(" ");

  return (
    <div
      role="img"
      aria-label={`Gợi ý: ${spoken}`}
      className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 font-mono text-lg"
    >
      {words.map((word, i) => (
        <span key={i} className="flex gap-1">
          {word.map((ch, j) => (
            <span
              key={j}
              className={cn(
                "inline-block w-[1.1ch] text-center",
                ch === null
                  ? "border-b-2 border-muted-foreground/40 text-transparent"
                  : "font-semibold text-primary"
              )}
            >
              {ch ?? "_"}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}