import { Fragment, useEffect, useId, useLayoutEffect, useRef } from "react";
import { Check, Eye, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AnswerStatus, HintToken } from "./types";
import { findFirstError } from "@/lib/firstError";

type Props = {
  value: string;
  status: AnswerStatus;
  hint: HintToken[] | null;
  /** Số lần sai. Đổi giá trị thì gợi ý rung lại */
  attempt: number;
  /** Đổi giá trị này (mỗi câu mới) thì ô nhập tự focus */
  focusKey: number;
  answers: string | string[];
  onChange: (value: string) => void;
};

const STATUS_ICON = {
  correct: { Icon: Check, className: "bg-emerald-500 text-white" },
  revealed: { Icon: Eye, className: "bg-amber-500 text-white" },
  wrong: { Icon: X, className: "bg-red-500 text-white" },
} as const;

export function AnswerInput({ value, status, hint, attempt, focusKey, answers, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const handled = useRef<string | null>(null);
  const hintId = useId();
  const disabled = status === "correct" || status === "revealed";
  const icon = status !== "answering" ? STATUS_ICON[status] : null;

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [focusKey, disabled]);

  useLayoutEffect(() => {
    if (status !== "wrong") return;
    const key = `${focusKey}:${attempt}`;
    if (handled.current === key) return;
    handled.current = key;

    const el = ref.current;
    if (!el || !value.trim()) return;

    const list = Array.isArray(answers) ? answers : [answers];
    const range = findFirstError(value, list);
    if (!range) return;

    el.focus({ preventScroll: true });
    el.setSelectionRange(range.caret, range.caret);
  }, [status, attempt, focusKey, value, answers]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={ref}
          rows={3}
          value={value}
          disabled={disabled}
          // Enter dùng để nộp bài, xuống dòng (kể cả khi dán) chuyển thành dấu cách
          onChange={(e) => onChange(e.target.value.replace(/\r?\n/g, " "))}
          placeholder="Nhập câu tiếng Anh bạn nghe được…"
          aria-label="Câu bạn nghe được"
          aria-invalid={status === "wrong"}
          aria-describedby={hint ? hintId : undefined}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false} // tránh trình duyệt gợi ý chính tả, vô tình nhắc bài
          className={cn(
            "min-h-28 w-full resize-none rounded-xl bg-muted/30 px-4 py-3 pr-12 text-base leading-relaxed md:text-base",
            "transition-colors placeholder:text-muted-foreground/60 focus-visible:bg-background",
            "disabled:cursor-default disabled:opacity-100",
            status === "wrong" && "border-red-500/60 bg-red-500/5 focus-visible:ring-red-500/30",
            status === "correct" && "border-emerald-500/50 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100",
            status === "revealed" && "border-amber-500/40 bg-amber-500/5 text-muted-foreground line-through decoration-amber-500/50"
          )}
        />
        {icon && (
          <span
            aria-hidden
            className={cn(
              "absolute top-3 right-3 grid size-6 place-items-center rounded-full animate-in zoom-in-50 motion-reduce:animate-none",
              icon.className
            )}
          >
            <icon.Icon className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </div>

      {/* key theo attempt để animation chạy lại mỗi lần sai */}
      {hint && <AnswerHint key={attempt} id={hintId} tokens={hint} />}
    </div>
  );
}

/** Nhỏ và chỉ dùng ở đây nên để chung file */
function AnswerHint({ id, tokens }: { id: string; tokens: HintToken[] }) {
  return (
    <div
      id={id}
      role="alert"
      className="space-y-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 animate-shake motion-reduce:animate-none"
    >
      <p className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
        <X className="size-4" /> Chưa đúng, nghe lại
        <kbd className="rounded border border-red-500/30 px-1 font-mono text-[11px]">Ctrl</kbd>
        và thử lại nhé!
      </p>
      <p className="flex flex-wrap gap-1.5">
        {tokens.map((t, i) => (
          <Fragment key={i}>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-mono text-sm",
                t.hidden
                  ? "bg-muted/80 tracking-widest text-muted-foreground/50"
                  : "bg-background font-semibold text-foreground shadow-xs ring-1 ring-red-500/15"
              )}
            >
              {t.text}
            </span>
          </Fragment>
        ))}
      </p>
    </div>
  );
}