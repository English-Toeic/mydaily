// src/hooks/useTTS.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Danh sách giọng tự nhiên, ưu tiên từ trên xuống
const PREFERRED_VOICES = [
  "Google US English",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Samantha",            // macOS/iOS
  "Karen", "Daniel",     // en-AU / en-GB tự nhiên
];

const RESUME_WATCHDOG_MS = 400;

const NETWORK_ERRORS = new Set(["network", "synthesis-failed", "synthesis-unavailable"]);

const isEnglish = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith("en");

export type TTSStatus = "idle" | "speaking" | "paused";

export interface SpeakOptions {
  lang?: string;
  rate?: number; // 0.5 - 1.5
  pitch?: number;   
  voice?: SpeechSynthesisVoice | null;
  onEnd?: () => void;
}

const hasTTS = () => typeof window !== "undefined" && "speechSynthesis" in window;

function pickVoice(list: SpeechSynthesisVoice[], online: boolean): SpeechSynthesisVoice | null {
  const pool = online ? list : list.filter((v) => v.localService);
  for (const name of PREFERRED_VOICES) {
    const v = pool.find((x) => x.name === name);
    if (v) return v;
  }
  return (
    pool.find((v) => v.lang === "en-US" && /google/i.test(v.name)) ??
    pool.find((v) => v.lang === "en-US") ??
    pool.find(isEnglish) ??
    null
  );
}

export function useTTS() {
  const [status, setStatus] = useState<TTSStatus>("idle");
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

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

    const repick = () => {
      voiceRef.current = pickVoice(voicesRef.current, navigator.onLine);
    };

    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (!list.length) return;
      voicesRef.current = list;
      setVoices(list);
      repick();
    };

    load();
    window.speechSynthesis.onvoiceschanged = load;
    window.addEventListener("online", repick);
    window.addEventListener("offline", repick);
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.removeEventListener("online", repick);
      window.removeEventListener("offline", repick);
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
    u.pitch = opts.pitch ?? 1;
    const voice = opts.voice ?? voiceRef.current;
    if (voice) {
      u.voice = voice;
      if (opts.voice) u.lang = voice.lang;
    }

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
    
    u.onend = () => {
      if (!isCurrent()) return;
      finish();
      opts.onEnd?.();
    };
    u.onerror = (e) => {
      if (!isCurrent()) return;
      
      if (NETWORK_ERRORS.has(e.error) && voice && !voice.localService) {
        const local = pickVoice(voicesRef.current, false);
        if (local) {
          voiceRef.current = local; // các lần sau dùng luôn, có mạng lại sẽ tự đổi về
          start(text, { ...opts, voice: local }, offset);
          return;
        }
      }

      finish();
      if (e.error !== "interrupted" && e.error !== "canceled") opts.onEnd?.();
    };

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

  const englishVoices = useMemo(() => voices.filter((v) => v.lang.startsWith("en")), [voices]);

  return {
    speak, stop, pause, resume, togglePause,
    status,
    speaking: status === "speaking",
    paused: status === "paused",
    supported, englishVoices, setVoice,
  };
}