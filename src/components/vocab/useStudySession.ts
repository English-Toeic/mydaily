import { useEffect, useRef, useState } from "react";
import type { Deck, StudyDirection, Word } from "@/types/vocab";
import { checkAnswer, hintTargetOf, letterCount, type Verdict } from "./answer";

export type StudyMode = StudyDirection | "mixed";
export type Phase = "answering" | "checked";
export type Card = { word: Word; dir: StudyDirection };
export type RestartKind = "all" | "unlearned" | "missed";
export type SessionStats = { answered: number; passed: number; streak: number; best: number };
export type Session = {
  queue: Card[];
  total: number;
  cleared: number;
  /** Các từ đã sai ít nhất một lần trong phiên */
  missed: Map<number, Word>;
  stats: SessionStats;
};

/** Từ sai quay lại sau ngần này từ, thay vì xuống tận cuối hàng */
const REINSERT_GAP = 3;
const MODE_KEY = "vocab:mode";
const AUTO_SPEAK_KEY = "vocab:auto-speak";
const MODES: StudyMode[] = ["vi-en", "en-vi", "mixed"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pickDir = (mode: StudyMode): StudyDirection =>
  mode === "mixed" ? (Math.random() < 0.5 ? "vi-en" : "en-vi") : mode;

const unlearned = (words: Word[]) => words.filter((w) => w.status !== "learned");

const createSession = (words: Word[], mode: StudyMode): Session => ({
  queue: shuffle(words).map((word) => ({ word, dir: pickDir(mode) })),
  total: words.length,
  cleared: 0,
  missed: new Map(),
  stats: { answered: 0, passed: 0, streak: 0, best: 0 },
});

function readMode(): StudyMode {
  const v = localStorage.getItem(MODE_KEY) as StudyMode | null;
  return v && MODES.includes(v) ? v : "vi-en";
}

type Options = {
  deck: Deck;
  onGrade: (word: Word, correct: boolean) => Promise<Word>;
  speak: (text: string) => void;
};

export function useStudySession({ deck, onGrade, speak }: Options) {
  const [mode, setModeState] = useState<StudyMode>(readMode);
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem(AUTO_SPEAK_KEY) !== "0");
  const [session, setSession] = useState(() => createSession(unlearned(deck.words), mode));

  // Trạng thái của thẻ hiện tại
  const [input, setInputState] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [overridden, setOverridden] = useState(false);
  const [hints, setHints] = useState(0);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Tăng mỗi khi sang thẻ mới, dùng để focus và tự đọc */
  const [cardKey, setCardKey] = useState(0);

  const card = session.queue[0] ?? null;
  const answer = card ? (card.dir === "vi-en" ? card.word.english : card.word.meaning) : "";
  const answerLang = card?.dir === "vi-en" ? "en" : "vi";
  const hintTarget = hintTargetOf(answer);
  const maxHints = letterCount(hintTarget);
  const checked = phase === "checked";
  const passed = checked && verdict !== "wrong" && hints === 0;
  // Việt → Anh: nghe trước khi trả lời là lộ đáp án
  const canListen = !!card && (card.dir === "en-vi" || checked);

  const speakRef = useRef(speak);
  useEffect(() => {
    speakRef.current = speak;
  });

  // Anh → Việt: đọc to từ ngay khi hiện thẻ
  useEffect(() => {
    if (autoSpeak && card?.dir === "en-vi") speakRef.current(card.word.english);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey]);

  const resetCard = () => {
    setInputState("");
    setPhase("answering");
    setVerdict(null);
    setOverridden(false);
    setHints(0);
    setError(null);
    setCardKey((k) => k + 1);
  };

  const reveal = (v: Verdict) => {
    if (!card) return;
    setVerdict(v);
    setPhase("checked");
    if (autoSpeak) speak(card.word.english);
  };

  const setInput = (v: string) => {
    if (!checked) setInputState(v);
  };

  const check = () => {
    if (!card || checked || grading || !input.trim()) return;
    reveal(checkAnswer(input, answer, answerLang));
  };

  const giveUp = () => {
    if (card && !checked) reveal("wrong");
  };

  const hint = () => {
    if (card && !checked) setHints((h) => Math.min(h + 1, maxHints));
  };

  /** Người học tự xác nhận mình đúng (đồng nghĩa, cách viết khác…) */
  const override = () => {
    if (checked && verdict === "wrong" && input.trim()) {
      setVerdict("correct");
      setOverridden(true);
    }
  };

  const next = async () => {
    if (!card || !checked || grading) return;
    setGrading(true);
    setError(null);
    try {
      const updated = await onGrade(card.word, passed);
      setSession((s) => {
        const streak = passed ? s.stats.streak + 1 : 0;
        const stats: SessionStats = {
          answered: s.stats.answered + 1,
          passed: s.stats.passed + (passed ? 1 : 0),
          streak,
          best: Math.max(s.stats.best, streak),
        };
        const rest = s.queue.slice(1);
        if (passed) return { ...s, queue: rest, cleared: s.cleared + 1, stats };

        const at = Math.min(REINSERT_GAP, rest.length);
        return {
          ...s,
          stats,
          missed: new Map(s.missed).set(updated.id, updated),
          queue: [...rest.slice(0, at), { word: updated, dir: pickDir(mode) }, ...rest.slice(at)],
        };
      });
      resetCard();
    } catch {
      setError("Không lưu được kết quả. Kiểm tra mạng rồi thử lại nhé.");
    } finally {
      setGrading(false);
    }
  };

  const setMode = (m: StudyMode) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
    setSession((s) => ({ ...s, queue: s.queue.map((c) => ({ ...c, dir: pickDir(m) })) }));
    resetCard();
  };

  const toggleAutoSpeak = () =>
    setAutoSpeak((v) => {
      localStorage.setItem(AUTO_SPEAK_KEY, v ? "0" : "1");
      return !v;
    });

  const replay = () => {
    if (card && canListen) speak(card.word.english);
  };

  const restart = (kind: RestartKind) => {
    const words =
      kind === "all" ? deck.words
      : kind === "unlearned" ? unlearned(deck.words)
      : [...session.missed.values()];
    setSession(createSession(words, mode));
    resetCard();
  };

  return {
    session, card, mode, autoSpeak, cardKey,
    input, phase, verdict, overridden, hints, maxHints, hintTarget,
    passed, canListen, grading, error,
    setInput, check, giveUp, hint, override, next,
    setMode, toggleAutoSpeak, replay, restart,
  };
}