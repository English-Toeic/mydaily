// components/AnswerInput.tsx
import type { KeyboardEvent, RefObject } from "react";
import { cn } from "@/lib/utils";
import type { SentenceVerdict } from "@/lib/sentences";
import { TONES } from "../ui";

interface Props {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  verdict: SentenceVerdict | null;
  checked: boolean;
  shaking: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onShakeEnd: () => void;
}

export function AnswerInput({
  inputRef, value, verdict, checked, shaking, onChange, onSubmit, onShakeEnd,
}: Props) {
  const tone = verdict ? TONES[verdict] : null;
  const Icon = tone?.Icon;

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter xuống dòng; bỏ qua khi bộ gõ đang ghép chữ
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    onSubmit();
  };

  return (
    <div
      onAnimationEnd={onShakeEnd}
      className={cn("relative", shaking && "animate-shake motion-reduce:animate-none")}
    >
      <textarea
        ref={inputRef}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        readOnly={checked}
        enterKeyHint={checked ? "next" : "done"}
        lang="en"
        placeholder="Viết câu tiếng Anh…"
        aria-label="Câu trả lời"
        aria-invalid={verdict === "wrong"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={cn(
          "block min-h-22 w-full resize-none rounded-2xl border-2 bg-background px-4 py-3 pr-12 text-lg leading-snug outline-none transition-all placeholder:text-muted-foreground/60",
          !tone && "border-input focus:border-primary focus:ring-4 focus:ring-primary/15",
          tone && cn(tone.input, tone.text)
        )}
      />
      {tone && Icon && (
        <span
          className={cn(
            "absolute right-3 top-3 grid size-7 place-items-center rounded-full text-white",
            tone.dot
          )}
        >
          <Icon className="size-4" strokeWidth={3} />
        </span>
      )}
    </div>
  );
}