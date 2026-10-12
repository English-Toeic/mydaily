import { Check, Eye, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Sentence } from "./types";

type Props = {
  sentence: Sentence;
  /** correct: tự trả lời đúng · revealed: bấm xem đáp án */
  status: "correct" | "revealed";
  onReplay: () => void;
};

export function RevealedAnswer({ sentence, status, onReplay }: Props) {
  const correct = status === "correct";
  const Icon = correct ? Check : Eye;

  return (
    <div
      role="status"
      className={cn(
        "overflow-hidden rounded-2xl border animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
        correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
      )}
    >
      {/* Thanh trạng thái */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm font-medium",
          correct
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        )}
      >
        <span
          className={cn(
            "grid size-5 place-items-center rounded-full text-white",
            correct ? "bg-emerald-500" : "bg-amber-500"
          )}
        >
          <Icon className="size-3" strokeWidth={3} />
        </span>
        {correct ? "Chính xác! 🎉" : "Đã xem đáp án, câu này chưa được tính là thuộc"}
      </div>

      {/* Nội dung */}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xl font-semibold leading-snug tracking-tight">{sentence.english}</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={onReplay}
            aria-label="Nghe lại"
            className="-mt-1 -mr-2 shrink-0 rounded-full"
          >
            <Volume2 className="size-4" />
          </Button>
        </div>
        <div className="border-t border-dashed pt-3">
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Nghĩa
          </p>
          <p className="text-muted-foreground">{sentence.vietnamese}</p>
        </div>
      </div>
    </div>
  );
}