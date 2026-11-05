import { useEffect } from "react";
import { Inbox } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MicButton } from "@/components/MicButton";
import { useTTS } from "@/hooks/useTTS";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { cn } from "@/lib/utils";
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
  const { speak, stop: stopTTS, togglePause, status } = useTTS();
  const s = useLessonSession({ ...props, speak });

  const speech = useSpeechInput({
    lang: "en-US",
    onText: (text) => s.setAnswer(text),
  });
  const { abort: abortSpeech } = speech;
  const practicing = s.view === "practice" && !!s.sentence;

  // Sang câu khác, đã trả lời, hoặc rời màn luyện thì tắt mic
  useEffect(() => {
    abortSpeech();
  }, [abortSpeech, s.step, s.isAnswered, s.view]);

  useEffect(() => {
    if (s.view !== "practice") stopTTS();
  }, [s.view, stopTTS]);

  const toggleMic = () => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    stopTTS(); // tránh mic thu lại giọng máy đọc
    speech.start();
  };

  // Nghe lại thì tắt mic trước
  const replay = () => {
    abortSpeech();
    s.replay();
  };

  // Kiểm tra thì tắt mic, tránh kết quả đến trễ ghi đè câu vừa nộp
  const check = () => {
    abortSpeech();
    s.check();
  };

  const primary = () => {
    if (!s.isAnswered) abortSpeech();
    s.primary();
  };

  // Người học tự gõ thì tắt mic
  const handleAnswer = (value: string) => {
    if (speech.listening) abortSpeech();
    s.setAnswer(value);
  };

  useLessonHotkeys({
    enabled: practicing,
    onEnter: primary,
    onReplay: replay,
    onTogglePause: togglePause,
    canTogglePause: status !== "idle",
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
                  status={status}
                  emphasized={!s.isAnswered}
                  enterLabel={enterLabel}
                  onPlay={replay}
                  onTogglePause={togglePause}
                />

                {s.isAnswered && (
                  <RevealedAnswer
                    sentence={s.sentence}
                    status={s.status as "correct" | "revealed"}
                    onReplay={replay}
                  />
                )}

                {/* relative + nhãn absolute: hiện/ẩn trạng thái mic không làm nhấp nhô layout */}
                <div className="relative">
                  <AnswerInput
                    value={s.answer}
                    status={s.status}
                    hint={s.hint}
                    attempt={s.attempts}
                    focusKey={s.step}
                    onChange={handleAnswer}
                    answers={s.sentence.english}
                  />
                  {!s.isAnswered && (speech.listening || speech.error) && (
                    <p
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "pointer-events-none absolute -top-5 right-1 flex items-center gap-1.5 text-xs",
                        speech.error ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {speech.listening && !speech.error && (
                        <span className="size-2 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none" />
                      )}
                      {speech.error ?? "Đang nghe…"}
                    </p>
                  )}
                </div>

                <AnswerActions
                  isAnswered={s.isAnswered}
                  willComplete={s.willComplete}
                  canCheck={s.answer.trim().length > 0}
                  canGiveUp={s.canGiveUp}
                  mic={
                    speech.supported ? (
                      <MicButton
                        listening={speech.listening}
                        onClick={toggleMic}
                        className="size-12 rounded-xl"
                      />
                    ) : undefined
                  }
                  onCheck={check}
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