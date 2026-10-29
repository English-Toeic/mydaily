// components/PracticeActions.tsx
import { ChevronRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { keepInputFocus } from "@/lib/keepInputFocus";
import type { Phase } from "../lib/session";

interface Props {
  phase: Phase;
  hinted: boolean;
  canCheck: boolean;
  isLast: boolean;
  onHint: () => void;
  onGiveUp: () => void;
  onCheck: () => void;
  onNext: () => void;
}

export function PracticeActions({
  phase, hinted, canCheck, isLast, onHint, onGiveUp, onCheck, onNext,
}: Props) {
  if (phase === "checked") {
    return (
      <div className="flex gap-2">
        <Button
          {...keepInputFocus}
          onClick={onNext}
          className="h-12 flex-1 rounded-xl text-base touch-manipulation"
        >
          {isLast ? "Xem kết quả" : "Câu tiếp"} <ChevronRight className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        {...keepInputFocus}
        onClick={onHint}
        disabled={hinted}
        className="h-12 rounded-xl px-4 touch-manipulation"
      >
        <Lightbulb className="size-4" />
        <span className="hidden min-[400px]:inline">Gợi ý</span>
      </Button>
      <Button
        variant="ghost"
        {...keepInputFocus}
        onClick={onGiveUp}
        className="h-12 rounded-xl px-3 text-muted-foreground touch-manipulation"
      >
        Không biết
      </Button>
      <Button
        {...keepInputFocus}
        onClick={onCheck}
        disabled={!canCheck}
        className="h-12 flex-1 rounded-xl text-base touch-manipulation"
      >
        {phase === "retry" ? "Kiểm tra lại" : "Kiểm tra"}
      </Button>
    </div>
  );
}