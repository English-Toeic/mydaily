import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { keepInputFocus } from "@/lib/keepInputFocus";

type Props = {
  speaking: boolean;
  emphasized: boolean;
  enterLabel: string;
  onPlay: () => void;
};

export function ListenPanel({ speaking, emphasized, enterLabel, onPlay }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-linear-to-b from-primary/6 to-transparent px-4 pt-8 pb-4">
      <div className="relative">
        {speaking && (
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-primary/25 motion-reduce:hidden"
          />
        )}
        <Button
          size="lg"
          variant={emphasized ? "default" : "secondary"}
          onClick={onPlay}
          {...keepInputFocus}
          aria-label={speaking ? "Đang phát" : "Nghe câu"}
          className={cn(
            "relative size-20 rounded-full transition-transform hover:scale-105 active:scale-95",
            emphasized && "shadow-lg shadow-primary/25"
          )}
        >
          {speaking ? <SoundWave /> : <Volume2 className="size-8" />}
        </Button>
      </div>

      <p className="text-sm font-medium text-muted-foreground">
        {speaking ? "Đang phát…" : "Nghe và gõ lại câu tiếng Anh"}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Ctrl</Kbd> nghe lại
        </span>
        <span aria-hidden className="text-border">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Enter</Kbd> {enterLabel}
        </span>
      </div>
    </div>
  );
}

function SoundWave() {
  return (
    <span aria-hidden className="flex h-7 items-center gap-1">
      {[0, 0.2, 0.4, 0.1, 0.3].map((delay, i) => (
        <span
          key={i}
          className="h-full w-1 rounded-full bg-current animate-sound-wave motion-reduce:animate-none"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}