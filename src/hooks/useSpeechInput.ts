import { useCallback, useEffect, useRef, useState } from "react";

// TS chưa có sẵn type cho SpeechRecognition → khai báo phần cần dùng
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const ERROR_TEXT: Record<string, string> = {
  "not-allowed": "Chưa cho phép dùng micro",
  "service-not-allowed": "Chưa cho phép dùng micro",
  "audio-capture": "Không tìm thấy micro",
  network: "Cần mạng để nhận giọng nói",
};
const ERROR_CLEAR_MS = 4000;

interface Options {
  lang?: string;
  /** Gọi liên tục khi đang nghe; final = true khi trình duyệt chốt kết quả */
  onText: (text: string, final: boolean) => void;
}

export function useSpeechInput({ lang = "en-US", onText }: Options) {
  const [supported] = useState(() => !!getCtor());
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  });

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || recRef.current) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false; // nói xong một câu là tự dừng
    rec.interimResults = true; // hiện chữ ngay khi đang nói
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let text = "";
      let final = true;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (!e.results[i].isFinal) final = false;
      }
      onTextRef.current(text.trim(), final);
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(ERROR_TEXT[e.error] ?? "Không nhận được giọng nói");
    };
    rec.onend = () => {
      if (recRef.current === rec) recRef.current = null;
      setListening(false);
    };

    recRef.current = rec;
    setError(null);
    setListening(true);
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setListening(false);
    }
  }, [lang]);

  /** Dừng và giữ kết quả cuối */
  const stop = useCallback(() => recRef.current?.stop(), []);

  /** Huỷ ngay, bỏ kết quả đang chờ */
  const abort = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    rec.onresult = null;
    rec.abort();
  }, []);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), ERROR_CLEAR_MS);
    return () => window.clearTimeout(t);
  }, [error]);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, error, start, stop, abort };
}