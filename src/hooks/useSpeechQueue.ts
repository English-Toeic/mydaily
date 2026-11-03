import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeakOptions } from "@/hooks/useTTS";

export type SpeakFn = (text: string, opts?: SpeakOptions) => void;

export interface SpeechItem {
  text: string;
  voice: SpeechSynthesisVoice | null;
  pitch: number;
  rate?: number;
}

export interface PlayOptions {
  from?: number;
  to?: number;
  /** Gọi khi đọc hết. Không gọi nếu bị cancel() hoặc bị play() mới cắt ngang */
  onDone?: () => void;
}

const GAP_MS = 350;

/** Đọc lần lượt nhiều câu, có thể huỷ giữa chừng */
export function useSpeechQueue(speak: SpeakFn, stop: () => void) {
  const runRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const play = useCallback(
    (items: SpeechItem[], {from = 0, to = items.length, onDone}: PlayOptions = {}) => {
      const run = ++runRef.current;
      window.clearTimeout(timerRef.current);
      
      const step = (i: number) => {
        if (runRef.current !== run) return;
        if (i >= to) {
          setPlayingIndex(null);
          onDone?.();
          return;
        }
        setPlayingIndex(i);
        const { text, ...opts } = items[i];
        speak(text, { ...opts, onEnd: () => window.setTimeout(() => step(i + 1), GAP_MS) });
      };
      step(from);
    },
    [speak]
  );

  const cancel = useCallback(() => {
    runRef.current++;
    window.clearTimeout(timerRef.current);
    setPlayingIndex(null);
    stop();
  }, [stop]);

  useEffect(
    () => () => {
      runRef.current++;
      window.clearTimeout(timerRef.current);
      stop();
    },
    [stop]
  );

  return { play, cancel, playingIndex };
}