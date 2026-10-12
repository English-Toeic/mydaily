import { ChevronRight, Eye, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isAnswered: boolean;
  willComplete: boolean;
  canCheck: boolean;
  canGiveUp: boolean;
  onCheck: () => void;
  onNext: () => void;
  onGiveUp: () => void;
};

const EnterHint = () => <span className="ml-2 opacity-60">(Enter)</span>;

export function AnswerActions({
  isAnswered, willComplete, canCheck, canGiveUp, onCheck, onNext, onGiveUp,
}: Props) {
  if (isAnswered) {
    return (
      <Button className="w-full" onClick={onNext}>
        {willComplete ? (
          <><PartyPopper className="mr-1 h-4 w-4" /> Xem kết quả</>
        ) : (
          <>Câu tiếp theo <ChevronRight className="ml-1 h-4 w-4" /></>
        )}
        <EnterHint />
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      {canGiveUp && (
        <Button variant="outline" onClick={onGiveUp} className="shrink-0 animate-in fade-in">
          <Eye className="mr-1 h-4 w-4" /> Xem đáp án
        </Button>
      )}
      <Button className="flex-1" onClick={onCheck} disabled={!canCheck}>
        Kiểm tra <EnterHint />
      </Button>
    </div>
  );
}