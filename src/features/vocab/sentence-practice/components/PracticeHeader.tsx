// components/PracticeHeader.tsx
import { Button } from "@/components/ui/button";
import { keepInputFocus } from "@/lib/keepInputFocus";

interface Props {
  index: number;
  total: number;
  onSkip: () => void;
}

export function PracticeHeader({ index, total, onSkip }: Props) {
  return (
    <header className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-semibold leading-tight">Luyện câu</h1>
        <p className="text-xs text-muted-foreground">
          Câu {index + 1}/{total} · dịch sang tiếng Anh
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        {...keepInputFocus}
        onClick={onSkip}
        className="shrink-0 rounded-full text-muted-foreground"
      >
        Bỏ qua
      </Button>
    </header>
  );
}