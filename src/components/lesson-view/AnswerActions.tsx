import { ChevronRight, Eye, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

type Props = {
  isAnswered: boolean;
  willComplete: boolean;
  canCheck: boolean;
  canGiveUp: boolean;
  onCheck: () => void;
  onNext: () => void;
  onGiveUp: () => void;
};

const EnterHint = () => (
  <Kbd className="ml-2 border-current/20 bg-white/15 text-current shadow-none">Enter</Kbd>
);

export function AnswerActions({
  isAnswered, willComplete, canCheck, canGiveUp, onCheck, onNext, onGiveUp,
}: Props) {
  if (isAnswered) {
    return (
      <Button
        size="lg"
        onClick={onNext}
        className="h-12 w-full rounded-xl text-base animate-in fade-in motion-reduce:animate-none"
      >
        {willComplete ? (
          <><PartyPopper className="mr-1 size-5" /> Xem kết quả</>
        ) : (
          <>Câu tiếp theo <ChevronRight className="ml-1 size-5" /></>
        )}
        <EnterHint />
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      {canGiveUp && (
        <Button
          size="lg"
          variant="outline"
          onClick={onGiveUp}
          className="h-12 rounded-xl text-amber-700 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400 animate-in fade-in motion-reduce:animate-none"
        >
          <Eye className="mr-1 size-4" /> Xem đáp án
        </Button>
      )}
      <Button size="lg" onClick={onCheck} disabled={!canCheck} className="h-12 flex-1 rounded-xl text-base">
        Kiểm tra <EnterHint />
      </Button>
    </div>
  );
}