import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Volume2, Check, X, ArrowLeftRight } from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const current = queue[0];
  const done = !current;

  const isViEn = direction === "vi-en";
  const prompt = current ? (isViEn ? current.meaning : current.english) : "";
  const answer = current ? (isViEn ? current.english : current.meaning) : "";

  useEffect(() => {
    inputRef.current?.focus();
  }, [current, direction]);

  if (done) {
    return (
      <div className="max-w-lg mx-auto p-4 flex flex-col items-center gap-4 py-20 text-center">
        <div className="text-5xl">🎉</div>
        <p className="text-lg font-semibold">
          Hoàn thành deck "{deck.name}"!
        </p>
        <Button onClick={onBack}>Quay lại</Button>
      </div>
    );
  }

  const isCorrect =
    input.trim().toLowerCase() === answer.trim().toLowerCase();

  const handleCheck = () => {
    if (!input.trim()) return;
    setChecked(true);
    speak(current.english);
  };

  const handleNext = async () => {
    await onGrade(current, isCorrect);
    setQueue((q) => (isCorrect ? q.slice(1) : [...q.slice(1), q[0]]));
    setInput("");
    setChecked(false);
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium truncate flex-1">{deck.name}</span>
        <span className="text-sm text-muted-foreground">
          còn {queue.length}
        </span>
      </div>

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

      <input
        ref={inputRef}
        value={input}
        onChange={(e) => !checked && setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          if (!checked) handleCheck();
          else handleNext();
        }}
        disabled={checked}
        placeholder="Nhập câu trả lời..."
        className={cn(
          "w-full text-lg px-4 py-3 rounded-xl border-2 outline-none transition-colors",
          !checked && "border-input focus:border-primary",
          checked && isCorrect && "border-green-500 bg-green-50 text-green-700",
          checked && !isCorrect && "border-red-500 bg-red-50 text-red-700"
        )}
      />

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

      <div className="mt-6 flex gap-2">
        {!checked ? (
          <Button className="flex-1" onClick={handleCheck}>
            Kiểm tra
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleNext}>
            {isCorrect ? "Tiếp theo →" : "Học lại (xuống cuối)"}
          </Button>
        )}
      </div>
    </div>
  );
}