import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Nội dung ở giữa, ví dụ bảng chọn câu */
  children?: ReactNode;
};

export function StepNav({ canPrev, canNext, onPrev, onNext, children }: Props) {
  return (
    <nav aria-label="Điều hướng câu" className="flex w-full items-center justify-between gap-2">
      <Button variant="ghost" size="sm" onClick={onPrev} disabled={!canPrev} className="text-muted-foreground">
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Câu trước</span>
      </Button>
      {children}
      <Button variant="ghost" size="sm" onClick={onNext} disabled={!canNext} className="text-muted-foreground">
        <span className="hidden sm:inline">Bỏ qua</span>
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}