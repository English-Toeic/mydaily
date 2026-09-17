// src/components/LessonView.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils";
import { useTTS } from "@/hooks/useTTS";
import {
  ArrowLeft, Volume2, Check, X, RotateCcw, ChevronRight, ChevronLeft,
} from "lucide-react";
import type { Lesson } from "@/types";
import { useProgress } from "@/hooks/useProgress";

interface Props {
  lesson: Lesson;
  learnedIds: number[];
  onBack: () => void;
  onCorrect: (sentenceId: number) => void;
  onActivity: () => void;
}

type Phase = "listening" | "revealed";
type Result = "idle" | "wrong";

export function LessonView({
  lesson, learnedIds, onBack, onCorrect, onActivity,
}: Props) {
  const { getLesson, resetLesson } = useProgress();
  const progress = getLesson(lesson.id);
  const total = lesson.sentences.length;

  // 👇 Tính câu bắt đầu = câu đầu tiên CHƯA học
  const startIndex = useMemo(() => {
    const learned = progress.learnedSentenceIds;
    const idx = lesson.sentences.findIndex((s) => !learned.includes(s.id));
    return idx === -1 ? 0 : idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]); // chỉ tính lại khi đổi bài

  const [index, setIndex] = useState(startIndex);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("listening");
  const [result, setResult] = useState<Result>("idle");
  const { speak, speaking } = useTTS();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sentence = lesson.sentences[index];
  const learnedCount = learnedIds.length;
  const percent = Math.round((learnedCount / total) * 100);
  const isLast = index === total - 1;
  const isCompleted = progress.status === "completed";

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[.,!?;:'"]/g, "").replace(/\s+/g, " ").trim();

  const playAudio = useCallback(() => {
    speak(sentence.english);
  }, [speak, sentence.english]);

  // Khi đổi bài → nhảy về câu chưa học
  useEffect(() => {
    setIndex(startIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // Khi đổi câu: reset + auto phát + focus
  useEffect(() => {
    setAnswer("");
    setPhase("listening");
    setResult("idle");
    const t = setTimeout(() => {
      playAudio();
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const check = useCallback(() => {
    onActivity();
    const ok = normalize(answer) === normalize(sentence.english);
    if (ok) {
      setPhase("revealed");
      setResult("idle");
      onCorrect(sentence.id); // 👈 cha gọi markSentenceLearned
    } else {
      setResult("wrong");
    }
  }, [answer, sentence, onActivity, onCorrect]);

  const next = useCallback(() => {
    onActivity();
    if (!isLast) setIndex((i) => i + 1);
  }, [isLast, onActivity]);

  const prev = useCallback(() => {
    onActivity();
    if (index > 0) setIndex((i) => i - 1);
  }, [index, onActivity]);

  // 👇 Học lại từ đầu
  const handleReset = useCallback(() => {
    resetLesson(lesson.id);
    setIndex(0);
    setAnswer("");
    setPhase("listening");
    setResult("idle");
  }, [resetLesson, lesson.id]);

  // Phím tắt
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        e.preventDefault();
        onActivity();
        playAudio();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (phase === "listening") check();
        else next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, check, next, playAudio, onActivity]);

  const buildHint = (correct: string, userInput: string) => {
    const correctWords = correct.trim().split(/\s+/);
    const userWords = normalize(userInput).split(/\s+/).filter(Boolean);

    // Đếm số từ đúng liên tiếp từ đầu
    let matched = 0;
    while (
      matched < correctWords.length &&
      matched < userWords.length &&
      normalize(correctWords[matched]) === userWords[matched]
    ) {
      matched++;
    }

    // Không khớp từ nào ở đầu → hiện toàn bộ câu để gợi ý mạnh
    if (matched === 0) return correct;

    // Lộ các từ đúng + 1 từ kế tiếp (từ gõ sai), che phần còn lại
    const reveal = matched + 1;
    return correctWords
      .map((w, i) =>
        i < reveal
          ? w
          : "*".repeat(w.replace(/[.,!?;:'"]/g, "").length)
      )
      .join(" ");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{lesson.level}</Badge>
          <span className="font-medium">{lesson.title}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Câu {index + 1}/{total}</span>
          <span>{learnedCount} câu đã thuộc · {percent}%</span>
        </div>
        <Progress value={percent} className="h-2" />
      </div>

      {/* 👇 MÀN HÌNH HOÀN THÀNH */}
      {isCompleted ? (
        <Card className="p-8 text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h3 className="text-xl font-semibold">Bạn đã hoàn thành bài này!</h3>
          <p className="text-muted-foreground">
            Đã thuộc {learnedCount}/{total} câu.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Về danh sách
            </Button>
            <Button onClick={handleReset}>
              <RotateCcw className="mr-1 h-4 w-4" /> Học lại từ đầu
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Vùng nghe */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-4 py-6">
              <Button
                size="lg"
                variant={phase === "revealed" ? "secondary" : "default"}
                onClick={() => { onActivity(); playAudio(); }}
                className="h-16 w-16 rounded-full"
              >
                <Volume2 className={cn("h-7 w-7", speaking && "animate-pulse")} />
              </Button>
              <p className="text-sm text-muted-foreground">
                Nghe và gõ lại câu tiếng Anh
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="rounded border bg-muted px-2 py-1">Ctrl</kbd>
                <span>nghe lại</span>
                <span className="mx-1">·</span>
                <kbd className="rounded border bg-muted px-2 py-1">Enter</kbd>
                <span>{phase === "listening" ? "kiểm tra" : "câu tiếp theo"}</span>
              </div>
            </div>

            {phase === "revealed" && (
              <div className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-semibold text-foreground">
                    {sentence.english}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { onActivity(); playAudio(); }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground">{sentence.vietnamese}</p>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <Check className="h-4 w-4" /> Chính xác! 🎉
                </div>
              </div>
            )}
          </Card>

          {/* Ô nhập */}
          <div className="space-y-2">
            <Textarea
              rows={4}
              ref={inputRef}
              value={answer}
              disabled={phase === "revealed"}
              onChange={(e) => { setAnswer(e.target.value); onActivity(); setResult("idle"); }}
              placeholder="Nhập câu tiếng Anh bạn nghe được..."
              className={cn(
                "w-full min-h-24 text-base resize-none",
                result === "wrong" && "border-red-500 focus-visible:ring-red-500"
              )}
              autoFocus
              autoComplete="off"
            />

            {result === "wrong" && (
              <div>
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <X className="h-4 w-4" /> Chưa đúng, nghe lại (Ctrl) và thử lại nhé!
                  
                </div>
                <p className="font-mono tracking-wide text-foreground">
                  {buildHint(sentence.english, answer)}
                </p>
              </div>
            )}

            {phase === "listening" ? (
              <Button className="w-full" onClick={check}>
                Kiểm tra <span className="ml-2 opacity-60">(Enter)</span>
              </Button>
            ) : (
              <Button className="w-full" onClick={next} disabled={isLast}>
                {isLast ? "Đã hoàn thành bài học 🎉" : "Câu tiếp theo"}
                {!isLast && <ChevronRight className="ml-1 h-4 w-4" />}
                {!isLast && <span className="ml-1 opacity-60">(Enter)</span>}
              </Button>
            )}
          </div>

          {/* Điều hướng phụ */}
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={prev} disabled={index === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Câu trước
            </Button>
            <Button variant="outline" size="sm" onClick={next} disabled={isLast}>
              Câu sau <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}