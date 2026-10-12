import { Fragment, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AnswerStatus, HintToken } from "./types";

type Props = {
  value: string;
  status: AnswerStatus;
  hint: HintToken[] | null;
  /** Đổi giá trị này (mỗi câu mới) thì ô nhập tự focus */
  focusKey: number;
  onChange: (value: string) => void;
};

export function AnswerInput({ value, status, hint, focusKey, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const hintId = useId();
  const disabled = status === "correct" || status === "revealed";

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [focusKey, disabled]);

  return (
    <div className="space-y-2">
      <Textarea
        ref={ref}
        rows={3}
        value={value}
        disabled={disabled}
        // Enter dùng để nộp bài, xuống dòng (kể cả khi dán) chuyển thành dấu cách
        onChange={(e) => onChange(e.target.value.replace(/\r?\n/g, " "))}
        placeholder="Nhập câu tiếng Anh bạn nghe được..."
        aria-label="Câu bạn nghe được"
        aria-invalid={status === "wrong"}
        aria-describedby={hint ? hintId : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false} // tránh trình duyệt gợi ý chính tả, vô tình nhắc bài
        className={cn(
          "min-h-24 w-full resize-none text-base",
          status === "wrong" && "border-red-500 focus-visible:ring-red-500"
        )}
      />
      {hint && <AnswerHint id={hintId} tokens={hint} />}
    </div>
  );
}

/** Nhỏ và chỉ dùng ở đây nên để chung file */
function AnswerHint({ id, tokens }: { id: string; tokens: HintToken[] }) {
  return (
    <div
      id={id}
      role="alert"
      className="space-y-1.5 rounded-md border border-red-500/30 bg-red-500/5 p-3 animate-in fade-in motion-reduce:animate-none"
    >
      <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <X className="h-4 w-4" /> Chưa đúng, nghe lại (Ctrl) và thử lại nhé!
      </p>
      <p className="font-mono tracking-wide">
        {tokens.map((t, i) => (
          <Fragment key={i}>
            {i > 0 && " "}
            <span className={t.hidden ? "text-muted-foreground/60" : "font-semibold text-foreground"}>
              {t.text}
            </span>
          </Fragment>
        ))}
      </p>
    </div>
  );
}