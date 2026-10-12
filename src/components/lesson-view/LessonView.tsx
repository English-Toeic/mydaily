import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { CompletionCard } from "./CompletionCard";
import type { LessonViewProps } from "./types";
import { SentenceJumper } from "./SentenceJumper";

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
    <div className="mx-auto max-w-2xl space-y-6">
      <LessonHeader lesson={lesson} mode={s.mode} onBack={onBack} />

      {!s.sentence ? (
        <EmptyState
          icon={Inbox}
          title="Bài học chưa có câu nào"
          description="Nội dung đang được cập nhật, bạn quay lại sau nhé."
        />
      ) : (
        <>
          <LessonProgressBar
            index={s.index}
            total={s.total}
            learnedCount={s.learnedCount}
            percent={s.percent}
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
            <>
              <Card className="space-y-4 p-6">
                <ListenPanel
                  speaking={speaking}
                  emphasized={!s.isAnswered}
                  enterLabel={enterLabel}
                  onPlay={s.replay}
                />
                {s.isAnswered && (
                  <RevealedAnswer
                    sentence={s.sentence}
                    status={s.status === "correct" ? "correct" : "revealed"}
                    onReplay={s.replay}
                  />
                )}
              </Card>

              <AnswerInput
                value={s.answer}
                status={s.status}
                hint={s.hint}
                focusKey={s.step}
                onChange={s.setAnswer}
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

              <StepNav
                canPrev={!s.isFirst}
                canNext={!s.isLast}
                onPrev={s.goPrev}
                onNext={s.skip}
              >
                <SentenceJumper 
                  current={s.index}
                  learned={s.learnedMarks}
                  nextUnlearned={s.nextUnlearnedIndex}
                  onJump={s.goTo}/>
                </StepNav>
            </>
          )}
        </>
      )}
    </div>
  );
}