import { useReducer, useState } from "react";
import { checkSentence, type SentenceVerdict } from "@/lib/sentences";
import type { AcceptedMap, Word } from "@/types/vocab";
import { canCheck, initialSession, sessionReducer, type Graded } from "../lib/session";
import { describeErrors } from "../lib/retry";

export type Sentence = NonNullable<Word["sentences"]>[number];

interface Options {
  word: Word;
  speak: (text: string) => void;
  autoSpeak: boolean;
  onAccept?: (word: Word, key: string, text: string) => Promise<Word>;
}

const sentenceKey = (i: number) => `s${i}`;

export function usePracticeSession({ word, speak, autoSpeak, onAccept }: Options) {
  const sentences = word.sentences ?? [];
  const [state, dispatch] = useReducer(sessionReducer, initialSession);
  const [localAccepted, setLocalAccepted] = useState<AcceptedMap>({});
  const current: Sentence | undefined = sentences[state.index];
  const target = word.english;

  const answersOf = (i: number, s: Sentence): string[] => {
    const key = sentenceKey(i);
    return [...new Set([
      ...s.en,
      ...(word.accepted?.[key] ?? []),
      ...(localAccepted[key] ?? []),
    ])];
  };

  const finish = (verdict: SentenceVerdict, graded: Graded) => {
    dispatch({ type: "finish", verdict, graded });
    if (autoSpeak) speak(graded.best);
  };

  const check = () => {
    if (!current || !canCheck(state)) return;
    const r = checkSentence(state.input, answersOf(state.index, current), target);
    // Sai lần 1 → báo lỗi ở đâu (không lộ đáp án) rồi cho sửa; sai lần 2 → hiện đáp án
    if (r.verdict === "wrong" && state.phase === "answering") {
      dispatch({ type: "retry", graded: r, info: describeErrors(r, target) });
    } else {
      finish(r.verdict, r);
    }
  };

  const giveUp = () => {
    if (!current || state.phase === "checked") return;
    // Chấm lại câu đang gõ để phần tô màu khớp với chữ trên màn hình
    const graded: Graded = state.input.trim()
      ? checkSentence(state.input, answersOf(state.index, current), target)
      : { best: current.en[0], diff: [] };
    finish("wrong", graded);
  };

  const override = () => {
    const text = state.input.trim();
    const canSave =
      state.phase === "checked" && state.verdict !== "correct" && !!text && !!current;

    dispatch({ type: "override" });
    if (!canSave) return;

    const key = sentenceKey(state.index);
    setLocalAccepted((m) =>
      m[key]?.includes(text) ? m : { ...m, [key]: [...(m[key] ?? []), text] }
    );
    onAccept?.(word, key, text).catch(console.error);
  };

  return {
    state,
    sentences,
    total: sentences.length,
    current,
    canCheck: canCheck(state),
    actions: {
      setInput: (value: string) => dispatch({ type: "input", value }),
      hint: () => dispatch({ type: "hint" }),
      check,
      giveUp,
      override,
      next: () => current && dispatch({ type: "next", vi: current.vi }),
      restart: () => dispatch({ type: "restart" }),
      shakeEnd: () => dispatch({ type: "shakeEnd" }),
    },
  };
}