import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { keepInputFocus } from "@/lib/keepInputFocus";
import type { TTSStatus } from "@/hooks/useTTS";

type Props = {
  status: TTSStatus;
  emphasized: boolean;
  enterLabel: string;
  onPlay: () => void;
  onTogglePause: () => void;
};

export function ListenPanel({ status, emphasized, enterLabel, onPlay, onTogglePause }: Props) {
  const idle = status === "idle";
  const speaking = status === "speaking";
  const paused = status === "paused";

  const Icon = speaking ? Pause : paused ? Play : Volume2;
  const label = speaking ? "Tạm dừng" : paused ? "Tiếp tục phát" : "Nghe câu";

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-linear-to-b from-primary/6 to-transparent px-4 pt-8 pb-4">
      <div className="relative">
        {speaking && (
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-primary/25 motion-reduce:hidden"
          />
        )}
        {paused && (
          <span aria-hidden className="absolute -inset-1.5 rounded-full border-2 border-dashed border-primary/40" />
        )}
        <Button
          size="lg"
          variant={emphasized || !idle ? "default" : "secondary"}
          onClick={idle ? onPlay : onTogglePause}
          {...keepInputFocus}
          aria-label={label}
          title={label}
          className={cn(
            "relative size-20 rounded-full transition-transform hover:scale-105 active:scale-95",
            emphasized && "shadow-lg shadow-primary/25"
          )}
        >
          {/* Icon Play hơi lệch trái về thị giác, đẩy nhẹ sang phải */}
          <Icon className={cn("size-8", paused && "translate-x-0.5")} />
        </Button>

        {!idle && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onPlay}
            {...keepInputFocus}
            aria-label="Nghe lại từ đầu"
            title="Nghe lại từ đầu"
            className="absolute top-1/2 -right-14 -translate-y-1/2 rounded-full text-muted-foreground animate-in fade-in zoom-in-90 motion-reduce:animate-none"
          >
            <RotateCcw className="size-5" />
          </Button>
        )}
      </div>

      <p
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
        aria-live="polite"
      >
        {speaking && <SoundWave />}
        {speaking
          ? "Đang phát… bấm để tạm dừng"
          : paused
            ? "Đã tạm dừng · bấm để nghe tiếp"
            : "Nghe và gõ lại câu tiếng Anh"}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Ctrl</Kbd> nghe lại
        </span>
        <span aria-hidden className="text-border">|</span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>Esc</Kbd> {paused ? "tiếp tục" : "tạm dừng"}
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