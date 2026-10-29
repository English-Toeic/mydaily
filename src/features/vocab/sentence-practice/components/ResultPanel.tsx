// components/ResultPanel.tsx
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { keepInputFocus } from "@/lib/keepInputFocus";
import type { SentenceVerdict } from "@/lib/sentences";
import { resultTitle } from "../lib/feedback";
import type { Graded } from "../lib/session";
import { TONES, pillBtn } from "../ui";
import { AnswerDiff } from "./AnswerDiff";

interface Props {
  verdict: SentenceVerdict;
  graded: Graded;
  input: string;
  /** Tất cả đáp án đúng của câu */
  alternatives: string[];
  hinted: boolean;
  overridden: boolean;
  speaking: boolean;
  onSpeak: () => void;
  onOverride: () => void;
}

export function ResultPanel({
  verdict, graded, input, alternatives, hinted, overridden, speaking, onSpeak, onOverride,
}: Props) {
  const tone = TONES[verdict];
  const hasInput = !!input.trim();
  const others = alternatives.filter((a) => a !== graded.best);
  const title = resultTitle({ verdict, hasInput, overridden, hinted });

  return (
    <div role="status" className={cn("rounded-2xl border p-4", tone.box)}>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("font-semibold", tone.text)}>{title}</p>
        {verdict === "wrong" && hasInput && (
          <button type="button" {...keepInputFocus} onClick={onOverride} className={pillBtn}>
            Tôi đúng
          </button>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2">
        <AnswerDiff
          answer={graded.best}
          diff={graded.diff}
          highlight={verdict !== "correct" && hasInput}
        />
        <button
          type="button"
          {...keepInputFocus}
          onClick={onSpeak}
          aria-label="Nghe đáp án"
          className="mt-0.5 shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground active:scale-95 touch-manipulation"
        >
          <Volume2 className={cn("size-4", speaking && "animate-pulse text-primary")} />
        </button>
      </div>

      {others.length > 0 && (
        <p lang="en" className="mt-3 border-t border-current/10 pt-2 text-sm text-muted-foreground">
          Cách khác: {others.join(" · ")}
        </p>
      )}
    </div>
  );
}