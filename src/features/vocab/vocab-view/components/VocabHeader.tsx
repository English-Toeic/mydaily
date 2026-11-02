// components/VocabHeader.tsx
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  subtitle?: string;
  onBack: () => void;
  onAdmin: () => void;
}

export function VocabHeader({ subtitle, onBack, onAdmin }: Props) {
  return (
    <header className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        aria-label="Quay lại"
        className="shrink-0 rounded-full"
      >
        <ArrowLeft className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight">Từ vựng</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <Button variant="outline" size="sm" onClick={onAdmin} className="gap-1.5 rounded-full">
        <Settings className="size-4" />
        Quản lý
      </Button>
    </header>
  );
}