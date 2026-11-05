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
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { cn } from "@/lib/utils";
import { MicButton } from "@/components/MicButton";

interface Props {
  word: Word;
  speak: (text: string) => void;
  speaking: boolean;
  autoSpeak: boolean;
  onAccept?: (word: Word, key: string, text: string) => Promise<Word>;
  onDone: () => void;
}

export function SentencePractice(props: Props) {
  // Đổi từ thì bắt đầu phiên mới, tránh index/kết quả của từ cũ còn sót
  return <PracticeSession key={props.word.id} {...props} />;
}

function PracticeSession({ word, speak, speaking, autoSpeak, onAccept, onDone }: Props) {
  const { state, sentences, total, current, canCheck, actions } = usePracticeSession({
    word,
    speak,
    autoSpeak,
    onAccept
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const checked = state.phase === "checked";
  const best = state.graded?.best ?? "";

   const speech = useSpeechInput({
    lang: "en-US",
    onText: (text) => actions.setInput(text),
  });
  const { abort: abortSpeech } = speech;

  // Đã kiểm tra hoặc sang câu mới thì tắt mic
  useEffect(() => {
    abortSpeech();
  }, [abortSpeech, state.index, checked]);

  const toggleMic = () => {
    if (speech.listening) speech.stop();
    else speech.start();
  };

  // Người học tự gõ thì tắt mic, tránh giọng nói ghi đè chữ vừa gõ
  const handleInput = (value: string) => {
    if (speech.listening) abortSpeech();
    actions.setInput(value);
  };

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
          onChange={handleInput}
          onSubmit={checked ? actions.next : actions.check}
          onShakeEnd={actions.shakeEnd}
        />

        {(speech.listening || speech.error) && (
          <span
            aria-live="polite"
            className={cn(
              "pointer-events-none absolute -top-2.5 right-3 flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs",
              speech.error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {speech.listening && <span className="size-1.5 animate-pulse rounded-full bg-destructive" />}
            {speech.error ?? "Đang nghe…"}
          </span>
        )}

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
        mic={
          speech.supported ? (
            <MicButton listening={speech.listening} disabled={speaking} onClick={toggleMic} />
          ) : undefined
        }
      />

      <ShortcutHints checked={checked} />
    </div>
  );
}