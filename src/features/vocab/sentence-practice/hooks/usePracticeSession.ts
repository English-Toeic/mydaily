import { useReducer } from "react";
import { checkSentence, type SentenceVerdict } from "@/lib/sentences";
import type { Word } from "@/types/vocab";
import { canCheck, initialSession, sessionReducer, type Graded } from "../lib/session";
import { describeErrors } from "../lib/retry";

export type Sentence = NonNullable<Word["sentences"]>[number];

interface Options {
  word: Word;
  speak: (text: string) => void;
  autoSpeak: boolean;
}

export function usePracticeSession({ word, speak, autoSpeak }: Options) {
  const sentences = word.sentences ?? [];
  const [state, dispatch] = useReducer(sessionReducer, initialSession);
  const current: Sentence | undefined = sentences[state.index];
  const target = word.english;

  const finish = (verdict: SentenceVerdict, graded: Graded) => {
    dispatch({ type: "finish", verdict, graded });
    if (autoSpeak) speak(graded.best);
  };

  const check = () => {
    if (!current || !canCheck(state)) return;
    const r = checkSentence(state.input, current.en, target);
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
      ? checkSentence(state.input, current.en, target)
      : { best: current.en[0], diff: [] };
    finish("wrong", graded);
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
      override: () => dispatch({ type: "override" }),
      next: () => current && dispatch({ type: "next", vi: current.vi }),
      restart: () => dispatch({ type: "restart" }),
      shakeEnd: () => dispatch({ type: "shakeEnd" }),
    },
  };
}