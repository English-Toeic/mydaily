import { useEffect, useRef } from "react";
import type { Word } from "@/types/vocab";
import { usePracticeSession } from "./hooks/usePracticeSession";
import { PracticeHeader } from "./components/PracticeHeader";
import { ProgressDots } from "./components/ProgressDots";
import { SentenceCard } from "./components/SentenceCard";
import { AnswerInput } from "./components/AnswerInput";
import { RetryFeedback } from "./components/RetryFeedback";
import { ResultPanel } from "./components/ResultPanel";
import { PracticeActions } from "./components/PracticeActions";
import { ShortcutHints } from "./components/ShortcutHints";
import { PracticeSummary } from "./components/PracticeSummary";
import { useCtrlTap } from "../useCtrlTap";

interface Props {
  word: Word;
  speak: (text: string) => void;
  speaking: boolean;
  autoSpeak: boolean;
  onDone: () => void;
}

export function SentencePractice(props: Props) {
  // Đổi từ thì bắt đầu phiên mới, tránh index/kết quả của từ cũ còn sót
  return <PracticeSession key={props.word.id} {...props} />;
}

function PracticeSession({ word, speak, speaking, autoSpeak, onDone }: Props) {
  const { state, sentences, total, current, canCheck, actions } = usePracticeSession({
    word,
    speak,
    autoSpeak,
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const checked = state.phase === "checked";
  const best = state.graded?.best ?? "";

  // Ctrl: nghe lại đáp án (chỉ sau khi đã kiểm tra, tránh lộ đáp án)
  useCtrlTap(() => {
    if (checked && best) speak(best);
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, [state.index]);

  if (total === 0) return null;

  if (!current) {
    return (
      <PracticeSummary
        word={word}
        results={state.results}
        speak={speak}
        onRestart={actions.restart}
        onDone={onDone}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-4 sm:py-8">
      <PracticeHeader index={state.index} total={total} onSkip={onDone} />
      <ProgressDots total={sentences.length} index={state.index} results={state.results} />
      <SentenceCard word={word} sentence={current} showHint={state.hinted && !checked} />

      <div className="space-y-3">
        <AnswerInput
          inputRef={inputRef}
          value={state.input}
          verdict={state.verdict}
          checked={checked}
          shaking={state.shaking}
          onChange={actions.setInput}
          onSubmit={checked ? actions.next : actions.check}
          onShakeEnd={actions.shakeEnd}
        />

        {state.phase === "retry" && state.retryInfo && (
          <RetryFeedback info={state.retryInfo} target={word.english} onGiveUp={actions.giveUp} />
        )}

        {checked && state.verdict && state.graded && (
          <ResultPanel
            verdict={state.verdict}
            graded={state.graded}
            input={state.input}
            alternatives={current.en}
            hinted={state.hinted}
            overridden={state.overridden}
            speaking={speaking}
            onSpeak={() => speak(best)}
            onOverride={actions.override}
          />
        )}
      </div>

      <PracticeActions
        phase={state.phase}
        hinted={state.hinted}
        canCheck={canCheck}
        isLast={state.index + 1 >= total}
        onHint={actions.hint}
        onGiveUp={actions.giveUp}
        onCheck={actions.check}
        onNext={actions.next}
      />

      <ShortcutHints checked={checked} />
    </div>
  );
}