import { cn } from "@/lib/utils";
import { keepInputFocus } from "@/lib/keepInputFocus";
import type { Word } from "@/types/vocab";
import type { Verdict } from "./answer";

type Tone = "emerald" | "amber" | "red";

// Tailwind v4: dùng biến CSS thay cho theme(); dark mode dùng tông sáng hơn cho dễ đọc
const TONE: Record<Tone, string> = {
  emerald:
    "border-emerald-500/30 bg-emerald-500/[0.06] [--tone:var(--color-emerald-600)] dark:[--tone:var(--color-emerald-400)]",
  amber:
    "border-amber-500/30 bg-amber-500/[0.06] [--tone:var(--color-amber-600)] dark:[--tone:var(--color-amber-400)]",
  red:
    "border-red-500/30 bg-red-500/[0.06] [--tone:var(--color-red-600)] dark:[--tone:var(--color-red-400)]",
};

interface Props {
  word: Word;
  verdict: Verdict;
  input: string;
  hinted: boolean;
  overridden: boolean;
  passed: boolean;
  note?: string;
  onOverride: () => void;
}

function toneOf(verdict: Verdict, hinted: boolean): Tone {
  if (verdict === "wrong") return "red";
  if (verdict === "almost" || hinted) return "amber";
  return "emerald";
}

function titleOf(verdict: Verdict, answered: boolean, hinted: boolean, overridden: boolean): string {
  if (verdict === "wrong") return answered ? "Chưa đúng" : "Không sao, ghi nhớ nhé";
  if (verdict === "almost") return "Gần đúng, chú ý chính tả";
  if (hinted) return "Đúng, nhưng đã dùng gợi ý";
  if (overridden) return "Đã tính là đúng";
  return "Chính xác! 🎉";
}

export function Feedback({ word, verdict, input, hinted, overridden, passed, note, onOverride }: Props) {
  const answered = !!input.trim();

  return (
    <div role="status" className={cn("rounded-2xl border p-4", TONE[toneOf(verdict, hinted)])}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-(--tone)">{titleOf(verdict, answered, hinted, overridden)}</p>
        {verdict === "wrong" && answered && (
          <button
            type="button"
            {...keepInputFocus}
            onClick={onOverride}
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border transition hover:bg-background hover:text-foreground touch-manipulation"
          >
            Tôi đúng
          </button>
        )}
      </div>

      {/* Luôn hiện đủ thông tin của từ để củng cố trí nhớ */}
      <div className="mt-3 space-y-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span lang="en" className="text-xl font-bold">{word.english}</span>
          {word.ipa && <span className="font-mono text-sm text-muted-foreground">{word.ipa}</span>}
        </p>
        <p className="text-sm text-muted-foreground">{word.meaning}</p>
      </div>

      {!passed && (
        <p className="mt-3 border-t border-current/10 pt-2 text-xs text-muted-foreground">
          Từ này sẽ quay lại sau vài từ nữa.
        </p>
      )}

      {note && <p className="mt-1 text-sm text-(--tone)/90">{note}</p>}
    </div>
  );
}