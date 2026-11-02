import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";
import type { Deck, Word } from "@/types/vocab";
import { useStudySession } from "../useStudySession";
import { useCtrlTap } from "../useCtrlTap";
import { usePracticeFlow } from "./hooks/usePracticeFlow";
import { StudySummary } from "./components/StudySummary";
import { SentencePractice } from "../sentence-practice";
import { StudyHeader } from "./components/StudyHeader";
import { ModeSwitch } from "./components/ModeSwitch";
import { StudyProgress } from "./components/StudyProgress";
import { QuestionCard } from "./components/QuestionCard";
import { AnswerInput } from "./components/AnswerInput";
import { Feedback } from "./components/Feedback";
import { StudyActions } from "./components/StudyActions";
import { ShortcutHints } from "./components/ShortcutHints";

interface Props {
  deck: Deck;
  onBack: () => void;
  onGrade: (word: Word, correct: boolean) => Promise<Word>;
}

const noop = () => {};

export function VocabStudyView({ deck, onBack, onGrade }: Props) {
  const { speak, speaking } = useTTS();
  const s = useStudySession({ deck, onGrade, speak });
  const practice = usePracticeFlow(s);
  const inputRef = useRef<HTMLInputElement>(null);

  // Đang luyện câu thì Ctrl do SentencePractice xử lý
  useCtrlTap(practice.word ? noop : s.replay);

  useEffect(() => {
    if (!practice.word) inputRef.current?.focus();
  }, [s.cardKey, practice.word]);

  if (practice.word) {
    return (
      <SentencePractice
        key={practice.word.id}
        word={practice.word}
        speak={speak}
        speaking={speaking}
        autoSpeak={s.autoSpeak}
        onDone={practice.finish}
      />
    );
  }

  if (!s.card) {
    return (
      <StudySummary
        deck={deck}
        session={s.session}
        onRestart={practice.restart}
        onBack={onBack}
        speak={speak}
      />
    );
  }

  const { card, verdict, session } = s;
  const isViEn = card.dir === "vi-en";
  const checked = s.phase === "checked";

  const submit = () => {
    if (checked) void practice.next();
    else s.check();
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-4 sm:py-8">
      <StudyHeader
        title={deck.name}
        remaining={session.queue.length}
        autoSpeak={s.autoSpeak}
        onToggleAutoSpeak={s.toggleAutoSpeak}
        practiceOn={practice.enabled}
        onTogglePractice={practice.toggle}
        onBack={onBack}
      />

      <ModeSwitch value={s.mode} onChange={s.setMode} />

      <StudyProgress session={session} />

      <QuestionCard
        word={card.word}
        isViEn={isViEn}
        canListen={s.canListen}
        speaking={speaking}
        onReplay={s.replay}
        hints={checked ? 0 : s.hints}
        hintTarget={s.hintTarget}
      />

      <div className="space-y-3">
        <AnswerInput
          inputRef={inputRef}
          value={s.input}
          onChange={s.setInput}
          onSubmit={submit}
          checked={checked}
          verdict={verdict}
          isViEn={isViEn}
        />

        {checked && verdict && (
          <Feedback
            word={card.word}
            verdict={verdict}
            input={s.input}
            hinted={s.hints > 0}
            overridden={s.overridden}
            passed={s.passed}
            note={s.note}
            onOverride={s.override}
          />
        )}
      </div>

      {s.error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          <AlertTriangle className="size-4 shrink-0" /> {s.error}
        </p>
      )}

      <StudyActions
        checked={checked}
        canSubmit={!!s.input.trim()}
        canHint={s.hints < s.maxHints}
        grading={s.grading}
        passed={s.passed}
        practiceCount={practice.willPractice ? practice.sentenceCount : 0}
        onHint={s.hint}
        onGiveUp={s.giveUp}
        onCheck={s.check}
        onNext={() => void practice.next()}
      />

      <ShortcutHints checked={checked} canListen={s.canListen} />
    </div>
  );
}