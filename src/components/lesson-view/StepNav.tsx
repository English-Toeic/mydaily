import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function StepNav({ canPrev, canNext, onPrev, onNext }: Props) {
  return (
    <nav className="flex justify-between" aria-label="Chuyển câu">
      <Button variant="outline" size="sm" onClick={onPrev} disabled={!canPrev}>
        <ChevronLeft className="mr-1 h-4 w-4" /> Câu trước
      </Button>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
        Bỏ qua <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </nav>
  );
}