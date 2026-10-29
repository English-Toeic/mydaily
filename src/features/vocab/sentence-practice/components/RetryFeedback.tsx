// components/RetryFeedback.tsx
import { keepInputFocus } from "@/lib/keepInputFocus";
import type { RetryInfo } from "../lib/retry";
import { pillBtn } from "../ui";

interface Props {
  info: RetryInfo;
  target: string;
  onGiveUp: () => void;
}

/** Sai lần 1: chỉ ra lỗi ở đâu nhưng không lộ đáp án */
export function RetryFeedback({ info, target, onGiveUp }: Props) {
  return (
    <div role="status" className="space-y-2 rounded-2xl border border-red-500/30 bg-red-500/6 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{info.summary}</p>
        <button type="button" {...keepInputFocus} onClick={onGiveUp} className={pillBtn}>
          Xem đáp án
        </button>
      </div>

      {info.targetMissing && (
        <p className="text-sm text-muted-foreground">
          Câu cần dùng từ{" "}
          <span lang="en" className="font-semibold text-foreground">{target}</span>
        </p>
      )}

      {info.flagged.length > 0 && (
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          Xem lại:
          {info.flagged.map((w) => (
            <span
              key={w}
              lang="en"
              className="rounded-md bg-red-500/10 px-1.5 py-0.5 font-medium text-red-700 dark:text-red-300"
            >
              {w}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}