import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Gauge, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Passage } from "@/types/passage";
import type { TextSegment } from "@/lib/passage-highlight";
import type { VoiceSlot } from "@/lib/passage-voices";
import { speakersOf } from "@/lib/passage-parse";
import { useSpeechQueue, type SpeakFn, type SpeechItem } from "@/hooks/useSpeechQueue";
import { HighlightedText } from "./HighlightedText";
import { speakerColor } from "./speaker-colors";

interface Props {
  passage: Passage;
  highlight: (text: string) => TextSegment[];
  voiceOf: (speaker: string | null) => VoiceSlot;
  speak: SpeakFn;
  stop: () => void;
  supported: boolean;
  onActivity?: () => void;
}

export function PassageReader({ passage, highlight, voiceOf, speak, stop, supported, onActivity }: Props) {
  const [showVi, setShowVi] = useState(true);
  const [slow, setSlow] = useState(false);
  const { play, cancel, playingIndex } = useSpeechQueue(speak, stop);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const isDialogue = passage.kind === "dialogue";
  const speakers = useMemo(() => speakersOf(passage.lines), [passage.lines]);

  const items = useMemo<SpeechItem[]>(
    () =>
      passage.lines.map((l) => ({
        text: l.en[0],
        ...voiceOf(l.speaker),
        rate: slow ? 0.75 : 1,
      })),
    [passage.lines, voiceOf, slow]
  );

  const segments = useMemo(
    () => passage.lines.map((l) => highlight(l.en[0])),
    [passage.lines, highlight]
  );

  // Cuộn theo dòng đang đọc
  useEffect(() => {
    if (playingIndex !== null) {
      itemRefs.current[playingIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [playingIndex]);

  const playing = playingIndex !== null;

  const playFrom = (from: number, to?: number) => {
    if (!supported) return;
    onActivity?.();
    play(items, { from, to });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {supported &&
          (playing ? (
            <Button size="sm" variant="secondary" onClick={cancel}>
              <Square className="size-4" />
              Dừng
            </Button>
          ) : (
            <Button size="sm" onClick={() => playFrom(0)}>
              <Play className="size-4" />
              Nghe cả bài
            </Button>
          ))}
        <Button
          size="sm"
          variant={slow ? "secondary" : "ghost"}
          aria-pressed={slow}
          onClick={() => setSlow((s) => !s)}
        >
          <Gauge className="size-4" />
          Đọc chậm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setShowVi((v) => !v)}>
          {showVi ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {showVi ? "Ẩn tiếng Việt" : "Hiện tiếng Việt"}
        </Button>
      </div>

      {!supported && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Trình duyệt này không hỗ trợ đọc to, bạn vẫn đọc được nội dung bên dưới.
        </p>
      )}

      <ol className="space-y-2">
        {passage.lines.map((l, i) => {
          const active = playingIndex === i;
          return (
            <li key={i} ref={(el) => { itemRefs.current[i] = el; }}>
              <div
                role={supported ? "button" : undefined}
                tabIndex={supported ? 0 : undefined}
                onClick={() => playFrom(i, i + 1)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    playFrom(i, i + 1);
                  }
                }}
                className={cn(
                  "rounded-lg border px-4 py-3 transition",
                  supported && "cursor-pointer hover:bg-muted/50",
                  active && "border-primary bg-primary/5"
                )}
              >
                {isDialogue && l.speaker && (
                  <div className={cn("mb-1 text-xs font-semibold", speakerColor(speakers, l.speaker))}>
                    {l.speaker}
                  </div>
                )}
                <p className="leading-relaxed">
                  <HighlightedText segments={segments[i]} />
                </p>
                {showVi && <p className="mt-1 text-sm text-muted-foreground">{l.vi}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}