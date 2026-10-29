// components/AnswerDiff.tsx
import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { DiffOp } from "@/lib/sentences";
import { KIND_LABEL, annotate, diffDetails, type Mark } from "../lib/annotate";

const MARK_CLASS: Record<Mark, string> = {
  ok: "",
  soft: "rounded bg-amber-500/15 px-0.5 text-amber-700 underline decoration-amber-500/60 decoration-dotted decoration-2 underline-offset-4 dark:text-amber-300",
  hard: "rounded bg-red-500/15 px-0.5 text-red-700 underline decoration-red-500/50 decoration-2 underline-offset-4 dark:text-red-300",
};

const NO_DETAILS = { extras: [], fixes: [] };
const MAX_FIXES = 4;

interface Props {
  answer: string;
  diff: DiffOp[];
  highlight: boolean;
  compact?: boolean;
}

export function AnswerDiff({ answer, diff, highlight, compact = false }: Props) {
  const words = useMemo(() => annotate(answer, highlight ? diff : []), [answer, diff, highlight]);
  const { extras, fixes } = useMemo(
    () => (highlight ? diffDetails(diff) : NO_DETAILS),
    [diff, highlight]
  );
  const hasMarks = words.some((w) => w.mark !== "ok");

  return (
    <div className="min-w-0 flex-1">
      <p lang="en" className={cn("leading-snug", compact ? "font-medium" : "text-lg font-semibold")}>
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className={MARK_CLASS[w.mark]}>{w.text}</span>{" "}
          </Fragment>
        ))}
      </p>

      {!compact && fixes.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm">
          {fixes.slice(0, MAX_FIXES).map((f, i) => (
            <li key={i} lang="en" className="text-muted-foreground">
              <span className="line-through decoration-red-500/60">{f.user}</span>
              {" → "}
              <span className="font-medium text-foreground">{f.answer}</span>{" "}
              <span lang="vi" className="text-xs">({KIND_LABEL[f.kind]})</span>
            </li>
          ))}
        </ul>
      )}

      {extras.length > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          Thừa:{" "}
          {extras.map((w, i) => (
            <span key={i} lang="en" className="mr-1.5 line-through decoration-red-500/60">
              {w}
            </span>
          ))}
        </p>
      )}

      {!compact && hasMarks && (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="text-red-600 dark:text-red-400">Đỏ</span>: lỗi nặng ·{" "}
          <span className="text-amber-600 dark:text-amber-400">Vàng</span>: lỗi nhỏ (chính tả, dạng từ, mạo từ, thứ tự)
        </p>
      )}
    </div>
  );
}