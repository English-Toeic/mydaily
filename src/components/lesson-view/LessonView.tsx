import { Inbox } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useTTS } from "@/hooks/useTTS";
import { useLessonSession } from "./useLessonSession";
import { useLessonHotkeys } from "./useLessonHotkeys";
import { LessonHeader } from "./LessonHeader";
import { LessonProgressBar } from "./LessonProgressBar";
import { ListenPanel } from "./ListenPanel";
import { RevealedAnswer } from "./RevealedAnswer";
import { AnswerInput } from "./AnswerInput";
import { AnswerActions } from "./AnswerActions";
import { StepNav } from "./StepNav";
import { SentenceJumper } from "./SentenceJumper";
import { CompletionCard } from "./CompletionCard";
import type { LessonViewProps } from "./types";

export function LessonView(props: LessonViewProps) {
  const { lesson, onBack } = props;
  const { speak, speaking } = useTTS();
  const s = useLessonSession({ ...props, speak });

  useLessonHotkeys({
    enabled: s.view === "practice" && !!s.sentence,
    onEnter: s.primary,
    onReplay: s.replay,
  });

  const enterLabel = s.isAnswered
    ? s.willComplete ? "xem kết quả" : "câu tiếp theo"
    : "kiểm tra";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:py-10">
      <LessonHeader lesson={lesson} mode={s.mode} onBack={onBack} />

      {!s.sentence ? (
        <EmptyState
          icon={Inbox}
          title="Bài học chưa có câu nào"
          description="Hãy quay lại danh sách và chọn bài khác."
        />
      ) : (
        <>
          <LessonProgressBar
            index={s.index}
            total={s.total}
            learnedCount={s.learnedCount}
            percent={s.percent}
            marks={s.learnedMarks}
            showStep={s.view === "practice"}
            isCurrentLearned={s.isCurrentLearned}
          />

          {s.view === "completion" ? (
            <CompletionCard
              mode={s.mode}
              learnedCount={s.learnedCount}
              total={s.total}
              onBack={onBack}
              onReview={s.startReview}
              onReset={s.restartLearning}
            />
          ) : (
            <Card className="animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
              <CardContent className="space-y-5">
                <ListenPanel
                  speaking={speaking}
                  emphasized={!s.isAnswered}
                  enterLabel={enterLabel}
                  onPlay={s.replay}
                />

                {s.isAnswered && (
                  <RevealedAnswer
                    sentence={s.sentence}
                    status={s.status as "correct" | "revealed"}
                    onReplay={s.replay}
                  />
                )}

                <AnswerInput
                  value={s.answer}
                  status={s.status}
                  hint={s.hint}
                  attempt={s.attempts}
                  focusKey={s.step}
                  onChange={s.setAnswer}
                  answers={s.sentence.english}
                />

                <AnswerActions
                  isAnswered={s.isAnswered}
                  willComplete={s.willComplete}
                  canCheck={s.answer.trim().length > 0}
                  canGiveUp={s.canGiveUp}
                  onCheck={s.check}
                  onNext={s.next}
                  onGiveUp={s.giveUp}
                />
              </CardContent>

              <CardFooter className="border-t">
                <StepNav canPrev={!s.isFirst} canNext={!s.isLast} onPrev={s.goPrev} onNext={s.skip}>
                  <SentenceJumper
                    current={s.index}
                    learned={s.learnedMarks}
                    nextUnlearned={s.nextUnlearnedIndex}
                    onJump={s.goTo}
                  />
                </StepNav>
              </CardFooter>
            </Card>
          )}
        </>
      )}
    </div>
  );
}