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

  return (
    <div
      role="status"
      className={cn(
        "space-y-3 rounded-lg border p-4 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none",
        correct ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold">{sentence.english}</p>
        <Button variant="ghost" size="icon" onClick={onReplay} aria-label="Nghe lại">
          <Volume2 className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-muted-foreground">{sentence.vietnamese}</p>
      {correct ? (
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4" /> Chính xác! 🎉
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
          <Eye className="h-4 w-4" /> Đã xem đáp án, câu này chưa được tính là thuộc
        </p>
      )}
    </div>
  );
}