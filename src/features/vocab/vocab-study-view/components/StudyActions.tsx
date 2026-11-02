import { ChevronRight, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { keepInputFocus } from "@/lib/keepInputFocus";

interface Props {
  checked: boolean;
  canSubmit: boolean;
  canHint: boolean;
  grading: boolean;
  passed: boolean;
  /** > 0 thì bước tiếp theo là luyện câu */
  practiceCount: number;
  onHint: () => void;
  onGiveUp: () => void;
  onCheck: () => void;
  onNext: () => void;
}

const BTN = "h-12 rounded-xl touch-manipulation";

export function StudyActions({
  checked, canSubmit, canHint, grading, passed, practiceCount,
  onHint, onGiveUp, onCheck, onNext,
}: Props) {
  if (checked) {
    const label = !passed
      ? "Học lại sau"
      : practiceCount > 0
        ? `Luyện ${practiceCount} câu`
        : "Tiếp theo";

    return (
      <div className="flex gap-2">
        <Button
          {...keepInputFocus}
          onClick={onNext}
          disabled={grading}
          aria-busy={grading}
          className={`${BTN} flex-1 text-base`}
        >
          {grading ? (
            <Loader2 className="size-4 animate-spin" aria-label="Đang lưu" />
          ) : (
            <>
              {label}
              <ChevronRight className="size-4" />
            </>
          )}
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
        disabled={!canHint}
        aria-label="Gợi ý"
        className={`${BTN} px-4`}
      >
        <Lightbulb className="size-4" />
        <span className="hidden min-[400px]:inline">Gợi ý</span>
      </Button>
      <Button
        variant="ghost"
        {...keepInputFocus}
        onClick={onGiveUp}
        className={`${BTN} px-3 text-muted-foreground`}
      >
        Không biết
      </Button>
      <Button
        {...keepInputFocus}
        onClick={onCheck}
        disabled={!canSubmit}
        className={`${BTN} flex-1 text-base`}
      >
        Kiểm tra
      </Button>
    </div>
  );
}