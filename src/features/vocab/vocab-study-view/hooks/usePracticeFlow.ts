import { useRef, useState } from "react";
import { usePersistentFlag } from "./usePersistentFlag";
import type { Word } from "@/types/vocab";
import type { RestartKind, useStudySession } from "../../useStudySession";

type Study = ReturnType<typeof useStudySession>;

const PRACTICE_KEY = "vocab:sentence-practice";

/** Số câu tối đa mỗi lượt, cần khớp với SentencePractice */
export const MAX_PRACTICE_SENTENCES = 5;

export function usePracticeFlow(s: Study) {
  const [enabled, setEnabled] = usePersistentFlag(PRACTICE_KEY, true);
  const [word, setWord] = useState<Word | null>(null);
  const [practiced, setPracticed] = useState<Set<Word["id"]>>(() => new Set());
  // s.grading chỉ cập nhật sau khi render, nên cần ref để chặn gọi trùng
  const busy = useRef(false);

  const current = s.card?.word;
  const sentenceCount = Math.min(current?.sentences?.length ?? 0, MAX_PRACTICE_SENTENCES);

  // Trả lời đúng + từ có câu + chưa luyện trong phiên → sẽ luyện câu
  const willPractice =
    !!current &&
    s.phase === "checked" &&
    s.passed &&
    enabled &&
    sentenceCount > 0 &&
    !practiced.has(current.id);

  const next = async () => {
    if (!current || s.grading || busy.current) return;
    busy.current = true;
    const shouldPractice = willPractice;
    try {
      await s.next(); // chấm điểm và lưu như cũ
    } finally {
      busy.current = false;
    }
    if (shouldPractice) {
      setPracticed((prev) => new Set(prev).add(current.id));
      setWord(current);
    }
  };

  const restart = (kind: RestartKind) => {
    setPracticed(new Set());
    setWord(null);
    s.restart(kind);
  };

  return {
    enabled,
    toggle: () => setEnabled((v) => !v),
    /** Từ đang luyện câu, `null` = đang học thẻ bình thường */
    word,
    willPractice,
    sentenceCount,
    next,
    restart,
    finish: () => setWord(null),
  };
}