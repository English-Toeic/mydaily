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

interface SpeakOptions {
  lang?: string;
  rate?: number; // 0.5 - 1.5
}

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load voices (thường async, phải nghe event)
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
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

  const speak = useCallback((text: string, opts: SpeakOptions = {}) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.lang ?? "en-US";
    u.rate = opts.rate ?? 1;
    u.pitch = 1;
    if (voiceRef.current) u.voice = voiceRef.current;

    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(u);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  // Cho phép người dùng đổi giọng thủ công (nếu muốn)
  const setVoice = useCallback((name: string) => {
    const v = voices.find((x) => x.name === name);
    if (v) voiceRef.current = v;
  }, [voices]);

  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));

  return { speak, stop, speaking, supported, englishVoices, setVoice };
}