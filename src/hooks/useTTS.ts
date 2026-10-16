// src/hooks/useTTS.ts
import { useCallback, useEffect, useRef, useState } from "react";

// Danh sách giọng tự nhiên, ưu tiên từ trên xuống
const PREFERRED_VOICES = [
  "Google US English",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Samantha",            // macOS/iOS
  "Karen", "Daniel",     // en-AU / en-GB tự nhiên
];

const RESUME_WATCHDOG_MS = 400;

export type TTSStatus = "idle" | "speaking" | "paused";

interface SpeakOptions {
  lang?: string;
  rate?: number; // 0.5 - 1.5
}

const hasTTS = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function useTTS() {
  const [status, setStatus] = useState<TTSStatus>("idle");
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef("");
  const optsRef = useRef<SpeakOptions>({});

  const charIndexRef = useRef(0);
  const watchdogRef = useRef<number | undefined>(undefined);

  // Load voices (thường async, phải nghe event)
  useEffect(() => {
    if (!hasTTS()) {
      setSupported(false);
      return;
    }

    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (!list.length) return;
      setVoices(list);

      // Chọn giọng tốt nhất
      let best: SpeechSynthesisVoice | undefined;
      for (const name of PREFERRED_VOICES) {
        best = list.find((v) => v.name === name);
        if (best) break;
      }
      // fallback: giọng en-US bất kỳ, ưu tiên "Google"
      if (!best) {
        best =
          list.find((v) => v.lang === "en-US" && /google/i.test(v.name)) ||
          list.find((v) => v.lang.startsWith("en"));
      }
      voiceRef.current = best ?? null;
    };

    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const start = useCallback((text: string, opts: SpeakOptions, offset = 0) => {
    if (!hasTTS()) return;
    const synth = window.speechSynthesis;
    window.clearTimeout(watchdogRef.current);

    synth.cancel();
    // Chrome: sau cancel() hàng đợi vẫn ở trạng thái paused, câu mới sẽ không phát
    if (synth.paused) synth.resume();

    const u = new SpeechSynthesisUtterance(text.slice(offset));
    u.lang = opts.lang ?? "en-US";
    u.rate = opts.rate ?? 1;
    u.pitch = 1;
    if (voiceRef.current) u.voice = voiceRef.current;

    const isCurrent = () => utterRef.current === u;
    const finish = () => {
      if (!isCurrent()) return;
      utterRef.current = null;
      window.clearTimeout(watchdogRef.current);
      setStatus("idle");
    };

    u.onstart = () => isCurrent() && setStatus("speaking");
    u.onpause = () => isCurrent() && setStatus("paused");
    u.onresume = () => {
      if (!isCurrent()) return;
      window.clearTimeout(watchdogRef.current);
      setStatus("speaking");
    };
    u.onboundary = (e) => {
      if (isCurrent() && e.name !== "sentence") charIndexRef.current = offset + e.charIndex;
    };
    u.onend = finish;
    u.onerror = finish;

    textRef.current = text;
    optsRef.current = opts;
    charIndexRef.current = offset;
    utterRef.current = u;
    synth.speak(u);
  }, []);

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => start(text, opts, 0),
    [start]
  );

  const pause = useCallback(() => {
    if (!hasTTS() || !utterRef.current) return;
    window.clearTimeout(watchdogRef.current);
    window.speechSynthesis.pause();
    // Một số trình duyệt không bắn onpause nên tự set
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (!hasTTS()) return;
    const synth = window.speechSynthesis;
    const u = utterRef.current;
    if (!u) return;

    synth.resume();
    setStatus("speaking");

    // Fallback: resume() không có tác dụng thì đọc tiếp từ từ đang dở
    window.clearTimeout(watchdogRef.current);
    watchdogRef.current = window.setTimeout(() => {
      if (utterRef.current !== u) return;
      if (synth.paused || !synth.speaking) {
        start(textRef.current, optsRef.current, charIndexRef.current);
      }
    }, RESUME_WATCHDOG_MS);
  }, [start]);

  const stop = useCallback(() => {
    if (!hasTTS()) return;
    window.clearTimeout(watchdogRef.current);
    utterRef.current = null;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, []);

  const togglePause = useCallback(() => {
    if (status === "speaking") pause();
    else if (status === "paused") resume();
  }, [status, pause, resume]);

  // Rời trang thì dừng đọc
  useEffect(() => {
    return () => {
      window.clearTimeout(watchdogRef.current);
      utterRef.current = null;
      if (hasTTS()) window.speechSynthesis.cancel();
    };
  }, []);

  // Cho phép người dùng đổi giọng thủ công (nếu muốn)
  const setVoice = useCallback((name: string) => {
    const v = voices.find((x) => x.name === name);
    if (v) voiceRef.current = v;
  }, [voices]);

  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));

  return {
    speak, stop, pause, resume, togglePause,
    status,
    speaking: status === "speaking",
    paused: status === "paused",
    supported, englishVoices, setVoice,
  };
}