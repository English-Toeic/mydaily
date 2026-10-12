import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

type Props = {
  speaking: boolean;
  emphasized: boolean;
  enterLabel: string;
  onPlay: () => void;
};

export function ListenPanel({ speaking, emphasized, enterLabel, onPlay }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <Button
        size="lg"
        variant={emphasized ? "default" : "secondary"}
        onClick={onPlay}
        aria-label={speaking ? "Đang phát" : "Nghe câu"}
        className="h-16 w-16 rounded-full shadow-md"
      >
        <Volume2 className={cn("h-7 w-7", speaking && "animate-pulse")} />
      </Button>
      <p className="text-sm text-muted-foreground">Nghe và gõ lại câu tiếng Anh</p>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <Kbd>Ctrl</Kbd> <span>nghe lại</span>
        <span aria-hidden>·</span>
        <Kbd>Enter</Kbd> <span>{enterLabel}</span>
      </div>
    </div>
  );
}