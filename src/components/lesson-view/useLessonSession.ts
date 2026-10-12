import { useEffect, useMemo, useReducer, useRef } from "react";
import { isAnswerCorrect } from "@/lib/utils";
import { ACTIVITY_THROTTLE_MS, AUTOPLAY_DELAY_MS, GIVE_UP_AFTER_ATTEMPTS } from "./config";
import { createInitialState, sessionReducer } from "./session";
import { buildHint, findNextUnlearned, getLearnedSet, toPercent } from "./utils";
import type { LessonViewProps } from "./types";

type Options = Omit<LessonViewProps, "onBack"> & {
  speak: (text: string) => void;
};

export function useLessonSession({
  lesson,
  progress,
  onCorrect,
  onActivity,
  onReset,
  speak,
}: Options) {
  const sentences = lesson.sentences;
  const total = sentences.length;

  const learnedSet = useMemo(
    () => getLearnedSet(sentences, progress.learnedSentenceIds),
    [sentences, progress.learnedSentenceIds]
  );
  const learnedCount = learnedSet.size;

  const [state, dispatch] = useReducer(sessionReducer, null, () =>
    createInitialState(
      findNextUnlearned(sentences, learnedSet),
      total > 0 && learnedSet.size === total
    )
  );

  const sentence = sentences[state.index];
  const isFirst = state.index === 0;
  const isLast = state.index === total - 1;
  const isAnswered = state.status === "correct" || state.status === "revealed";

  // Tính luôn câu vừa trả lời đúng, phòng khi parent cập nhật progress bất đồng bộ (ví dụ lưu lên server)
  const effectiveLearned = useMemo(() => {
    if (state.status !== "correct" || !sentence || learnedSet.has(sentence.id)) return learnedSet;
    return new Set(learnedSet).add(sentence.id);
  }, [learnedSet, state.status, sentence]);

  /** Bấm "tiếp theo" lúc này có dẫn tới màn hình tổng kết không */
  const willComplete =
    state.mode === "review" ? isLast : effectiveLearned.size === total;

  // ---- activity (throttle khi gõ phím) ----
  const lastActivity = useRef(0);
  const touchActivity = (throttle = false) => {
    const now = Date.now();
    if (throttle && now - lastActivity.current < ACTIVITY_THROTTLE_MS) return;
    lastActivity.current = now;
    onActivity();
  };

  // ---- autoplay mỗi khi vào câu mới ----
  const speakRef = useRef(speak);
  useEffect(() => {
    speakRef.current = speak;
  });

  const text = sentence?.english;
  useEffect(() => {
    if (state.view !== "practice" || !text) return;
    const t = setTimeout(() => speakRef.current(text), AUTOPLAY_DELAY_MS);
    return () => clearTimeout(t);
  }, [state.step, state.view, text]);

  // ---- actions ----
  const replay = () => {
    if (!sentence) return;
    touchActivity();
    speak(sentence.english);
  };

  const setAnswer = (value: string) => {
    dispatch({ type: "input", value });
    touchActivity(true);
  };

  const check = () => {
    if (!sentence || isAnswered || !state.answer.trim()) return;
    touchActivity();
    if (isAnswerCorrect(state.answer, sentence.english)) {
      dispatch({ type: "correct" });
      onCorrect(sentence.id);
    } else {
      dispatch({ type: "wrong" });
    }
  };

  const giveUp = () => {
    if (isAnswered) return;
    touchActivity();
    dispatch({ type: "giveUp" });
  };

  const next = () => {
    touchActivity();
    if (state.mode === "review") {
      dispatch(isLast ? { type: "complete" } : { type: "go", index: state.index + 1 });
      return;
    }
    const target = findNextUnlearned(sentences, effectiveLearned, state.index + 1);
    dispatch(target === -1 ? { type: "complete" } : { type: "go", index: target });
  };

  /** Enter hoặc nút chính: chưa có kết quả thì kiểm tra, có rồi thì sang câu tiếp */
  const primary = () => (isAnswered ? next() : check());

  const goPrev = () => {
    if (isFirst) return;
    touchActivity();
    dispatch({ type: "go", index: state.index - 1 });
  };

  const skip = () => {
    if (isLast) return;
    touchActivity();
    dispatch({ type: "go", index: state.index + 1 });
  };

  const startReview = () => {
    touchActivity();
    dispatch({ type: "restart", mode: "review", index: 0 });
  };

  const restartLearning = () => {
    onReset();
    dispatch({ type: "restart", mode: "learn", index: 0 });
  };

  const goTo = (target: number) => {
    if (!Number.isInteger(target) || target < 0 || target >= total) return;
    // Đang ở đúng câu đó thì không làm gì, tránh xoá câu đang gõ
    if (target === state.index && state.view === "practice") return;
    touchActivity();
    dispatch({ type: "go", index: target });
  };

  const learnedMarks = useMemo(
    () => sentences.map((s) => learnedSet.has(s.id)),
    [sentences, learnedSet]
  );

  /** Câu chưa thuộc kế tiếp sau câu hiện tại (quay vòng). -1 nếu đã thuộc hết */
  const nextUnlearnedIndex = findNextUnlearned(sentences, effectiveLearned, state.index + 1);


  return {
    // dữ liệu
    sentence,
    total,
    learnedCount,
    percent: toPercent(learnedCount, total),
    isCurrentLearned: sentence ? learnedSet.has(sentence.id) : false,
    hint:
      state.status === "wrong" && sentence
        ? buildHint(sentence.english, state.checkedAnswer)
        : null,
    canGiveUp: state.attempts >= GIVE_UP_AFTER_ATTEMPTS,
    // trạng thái
    ...state,
    isFirst,
    isLast,
    isAnswered,
    willComplete,
    learnedMarks,
    nextUnlearnedIndex,
    // hành động
    replay, setAnswer, check, giveUp, next, primary, goPrev, skip, startReview, restartLearning, goTo,
  };
}