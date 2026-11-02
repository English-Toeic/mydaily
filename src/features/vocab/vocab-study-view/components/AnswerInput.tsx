import type { KeyboardEvent, Ref } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Verdict } from "./answer";

interface Props {
  inputRef: Ref<HTMLInputElement>;
  value: string;
  onChange: (v: string) => void;
  /** Enter: kiểm tra hoặc sang từ tiếp theo */
  onSubmit: () => void;
  checked: boolean;
  verdict: Verdict | null | undefined;
  isViEn: boolean;
}

const INPUT_VERDICT: Record<Verdict, string> = {
  correct: "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  almost: "border-amber-500 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  wrong: "border-red-500 bg-red-500/5 text-red-700 line-through decoration-red-500/40 dark:text-red-300",
};

export function AnswerInput({ inputRef, value, onChange, onSubmit, checked, verdict, isViEn }: Props) {
  const wrong = checked && verdict === "wrong";

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Bỏ qua Enter khi bộ gõ Telex/VNI đang ghép chữ, và khi giữ phím (lặp)
    if (e.key !== "Enter" || e.nativeEvent.isComposing || e.repeat) return;
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className={cn("relative", wrong && "animate-shake motion-reduce:animate-none")}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        // readOnly thay vì disabled để giữ focus, bàn phím mobile không thu xuống
        readOnly={checked}
        enterKeyHint={checked ? "next" : "done"}
        lang={isViEn ? "en" : "vi"}
        placeholder={isViEn ? "Gõ từ tiếng Anh…" : "Gõ nghĩa tiếng Việt…"}
        aria-label="Câu trả lời"
        aria-invalid={wrong}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={cn(
          "h-14 w-full rounded-2xl border-2 bg-background px-4 pr-12 text-lg outline-none transition-all placeholder:text-muted-foreground/60",
          !checked && "border-input focus:border-primary focus:ring-4 focus:ring-primary/15",
          checked && verdict && INPUT_VERDICT[verdict]
        )}
      />
      {checked && verdict && <VerdictIcon verdict={verdict} />}
    </div>
  );
}

/* ---------- */

const VERDICT_ICON = {
  correct: { Icon: Check, className: "bg-emerald-500" },
  almost: { Icon: AlertTriangle, className: "bg-amber-500" },
  wrong: { Icon: X, className: "bg-red-500" },
} as const;

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  const { Icon, className } = VERDICT_ICON[verdict];
  return (
    <span
      aria-hidden
      className={cn(
        "absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-white",
        className
      )}
    >
      <Icon className="size-4" strokeWidth={3} />
    </span>
  );
}