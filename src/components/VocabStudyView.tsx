// src/components/VocabStudyView.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Volume2,
  Check,
  X,
  ArrowLeftRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTTS } from "@/hooks/useTTS";
import type { Deck, StudyDirection, Word } from "@/types/vocab";

interface Props {
  deck: Deck;
  onBack: () => void;
  onGrade: (word: Word, correct: boolean) => Promise<Word>;
}

export function VocabStudyView({ deck, onBack, onGrade }: Props) {
  const [direction, setDirection] = useState<StudyDirection>("vi-en");
  const { speak } = useTTS();

  const initial = useMemo(
    () => deck.words.filter((w) => w.status !== "learned"),
    [deck.words]
  );

  const [queue, setQueue] = useState<Word[]>(initial);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [grading, setGrading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const current = queue[0];
  const done = !current;

  const isViEn = direction === "vi-en";
  const prompt = current ? (isViEn ? current.meaning : current.english) : "";
  const answer = current ? (isViEn ? current.english : current.meaning) : "";

  const isCorrect =
    input.trim().toLowerCase() === answer.trim().toLowerCase();

  // Focus input khi chuyển từ mới hoặc đổi chiều
  useEffect(() => {
    if (!checked && !done) {
      inputRef.current?.focus();
    }
  }, [current, direction, checked, done]);

  // Focus nút next khi đã check để Enter hoạt động
  useEffect(() => {
    if (checked) {
      nextBtnRef.current?.focus();
    }
  }, [checked]);

  const handleCheck = () => {
    if (!input.trim()) return;
    setChecked(true);
    speak(current.english);
  };

  const handleNext = async () => {
    if (grading) return;
    setGrading(true);
    try {
      await onGrade(current, isCorrect);
      setQueue((q) => (isCorrect ? q.slice(1) : [...q.slice(1), q[0]]));
      setInput("");
      setChecked(false);
    } finally {
      setGrading(false);
    }
  };

  const handleRestartAll = () => {
    // Reset queue với TẤT CẢ từ trong deck (kể cả learned)
    const allWords = [...deck.words];
    // Shuffle để học ngẫu nhiên
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }
    setQueue(allWords);
    setInput("");
    setChecked(false);
  };

  const handleRestartNotLearned = () => {
    // Reset chỉ các từ chưa learned
    const notLearned = deck.words.filter((w) => w.status !== "learned");
    const shuffled = [...notLearned];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setQueue(shuffled);
    setInput("");
    setChecked(false);
  };

  // Xử lý phím Enter toàn cục trong component
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || done) return;
    e.preventDefault();
    if (!checked) {
      handleCheck();
    } else {
      handleNext();
    }
  };

  if (done) {
    const learnedCount = deck.words.filter(
      (w) => w.status === "learned"
    ).length;
    const totalCount = deck.words.length;

    return (
      <div
        className="max-w-lg mx-auto p-4 flex flex-col items-center gap-4 py-20 text-center"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleRestartAll();
        }}
        tabIndex={0}
      >
        <div className="text-5xl">🎉</div>
        <p className="text-lg font-semibold">
          Hoàn thành deck &ldquo;{deck.name}&rdquo;!
        </p>
        <p className="text-sm text-muted-foreground">
          Đã thuộc {learnedCount}/{totalCount} từ
        </p>

        <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
          <Button
            onClick={handleRestartAll}
            className="gap-2"
            variant="default"
          >
            <RotateCcw className="h-4 w-4" />
            Học lại tất cả ({totalCount} từ)
          </Button>

          {learnedCount < totalCount && (
            <Button
              onClick={handleRestartNotLearned}
              className="gap-2"
              variant="outline"
            >
              <RotateCcw className="h-4 w-4" />
              Học lại từ chưa thuộc ({totalCount - learnedCount} từ)
            </Button>
          )}

          <Button onClick={onBack} variant="ghost">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium truncate flex-1">{deck.name}</span>
        <span className="text-sm text-muted-foreground">
          còn {queue.length}
        </span>
      </div>

      {/* Direction toggle */}
      <div className="flex justify-center mb-6">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setDirection((d) => (d === "vi-en" ? "en-vi" : "vi-en"));
            setInput("");
            setChecked(false);
          }}
        >
          <ArrowLeftRight className="h-4 w-4" />
          {isViEn ? "Tiếng Việt → English" : "English → Tiếng Việt"}
        </Button>
      </div>

      {/* Prompt */}
      <div className="text-center mb-6">
        <p className="text-xs text-muted-foreground mb-2">
          {isViEn ? "Nhập từ tiếng Anh" : "Nhập nghĩa tiếng Việt"}
        </p>
        <p className="text-3xl font-bold">{prompt}</p>

        {isViEn && current.ipa && (
          <button
            onClick={() => speak(current.english)}
            className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Volume2 className="h-4 w-4" />
            {current.ipa}
          </button>
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => !checked && setInput(e.target.value)}
        disabled={checked}
        placeholder="Nhập câu trả lời..."
        className={cn(
          "w-full text-lg px-4 py-3 rounded-xl border-2 outline-none transition-colors",
          !checked && "border-input focus:border-primary",
          checked &&
            isCorrect &&
            "border-green-500 bg-green-50 text-green-700",
          checked && !isCorrect && "border-red-500 bg-red-50 text-red-700"
        )}
      />

      {/* Result */}
      {checked && (
        <div className="mt-4 text-center">
          {isCorrect ? (
            <p className="inline-flex items-center gap-1.5 text-green-600 font-medium">
              <Check className="h-5 w-5" /> Chính xác!
            </p>
          ) : (
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1.5 text-red-500 font-medium">
                <X className="h-5 w-5" /> Chưa đúng
              </p>
              <p className="text-sm text-muted-foreground">
                Đáp án: <span className="font-semibold">{answer}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hint: nhấn Enter */}
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Nhấn <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[11px] font-mono">Enter</kbd>{" "}
        để {checked ? "tiếp tục" : "kiểm tra"}
      </p>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {!checked ? (
          <Button
            className="flex-1"
            onClick={handleCheck}
            disabled={!input.trim()}
          >
            Kiểm tra
          </Button>
        ) : (
          <Button
            ref={nextBtnRef}
            className="flex-1"
            onClick={handleNext}
            disabled={grading}
          >
            {isCorrect ? "Tiếp theo →" : "Học lại (xuống cuối)"}
          </Button>
        )}
      </div>
    </div>
  );
}