import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Lightbulb, Trophy, Volume2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Word } from "@/types/vocab";
import { checkSentence, makeHint } from "@/lib/sentences";

type Status = "idle" | "correct" | "close" | "wrong" | "revealed";

interface Props {
  word: Word;
  onFinish: (score: { correct: number; total: number }) => void;
  onSkip?: () => void;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export function SentencePractice({ word, onFinish, onSkip }: Props) {
  const sentences = word.sentences ?? [];
  const total = sentences.length;

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [wrongOnce, setWrongOnce] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [best, setBest] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [anim, setAnim] = useState<"shake" | "pop" | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const current = sentences[index];
  const answered =
    status === "correct" || status === "close" || status === "revealed";

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  if (total === 0) return null;

  const check = () => {
    if (!input.trim() || answered) return;
    const r = checkSentence(input, current.en, word.english);
    setBest(r.best);

    if (r.verdict === "correct" || r.verdict === "close") {
      setStatus(r.verdict);
      setScore((s) => s + 1);
      setAnim("pop");
      speak(r.best);
    } else if (!wrongOnce) {
      setWrongOnce(true);
      setStatus("wrong");
      setAnim("shake");
    } else {
      setStatus("revealed");
      setAnim("shake");
      speak(r.best);
    }
  };

  const next = () => {
    if (index + 1 >= total) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setInput("");
    setStatus("idle");
    setWrongOnce(false);
    setShowHint(false);
    setBest("");
  };

  /* ---------------- Màn kết quả ---------------- */
  if (done) {
    const perfect = score === total;
    return (
      <div className="max-w-xl mx-auto p-6 text-center space-y-4 animate-pop">
        <Trophy
          className={cn(
            "h-14 w-14 mx-auto",
            perfect ? "text-reward" : "text-primary"
          )}
        />
        <h2 className="text-xl font-semibold">
          {perfect ? "Xuất sắc!" : "Hoàn thành!"}
        </h2>
        <p className="text-muted-foreground">
          Bạn dịch đúng{" "}
          <span className="font-semibold text-foreground">
            {score}/{total}
          </span>{" "}
          câu với từ <span className="font-medium text-primary">{word.english}</span>
        </p>
        <Button onClick={() => onFinish({ correct: score, total })}>
          Tiếp tục <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  /* ---------------- Màn luyện ---------------- */
  const otherAnswers = current.en.filter((a) => a !== best);

  return (
    <div className="max-w-xl mx-auto p-4 space-y-5">
      {/* tiến độ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Dịch sang tiếng Anh · {index + 1}/{total}
          </span>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Bỏ qua phần này
            </button>
          )}
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary to-reward transition-all duration-500"
            style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* từ đang học */}
      <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm">
        <span className="font-semibold text-accent-foreground">{word.english}</span>
        <span className="text-muted-foreground">— {word.meaning}</span>
      </div>

      {/* câu tiếng Việt */}
      <p className="text-xl font-medium leading-relaxed">{current.vi}</p>

      {/* ô nhập */}
      <div
        className={cn(anim === "shake" && "animate-shake", anim === "pop" && "animate-pop")}
        onAnimationEnd={() => setAnim(null)}
      >
        <textarea
          ref={inputRef}
          value={input}
          readOnly={answered}
          rows={2}
          onChange={(e) => {
            setInput(e.target.value);
            if (status === "wrong") setStatus("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              answered ? next() : check();
            }
          }}
          placeholder="Viết câu tiếng Anh..."
          className={cn(
            "w-full resize-none rounded-xl border-2 bg-background px-4 py-3 text-base outline-none transition-colors",
            status === "idle" && "border-input focus:border-primary",
            status === "correct" && "border-success bg-success/5",
            status === "close" && "border-primary bg-primary/5",
            (status === "wrong" || status === "revealed") &&
              "border-destructive bg-destructive/5"
          )}
        />
      </div>

      {/* gợi ý */}
      {showHint && !answered && (
        <p className="font-mono text-sm tracking-wide text-muted-foreground">
          💡 {makeHint(current.en[0])}
        </p>
      )}

      {/* phản hồi */}
      {status !== "idle" && (
        <div
          className={cn(
            "rounded-xl p-4 text-sm space-y-1",
            status === "correct" && "bg-success/10 text-success",
            status === "close" && "bg-primary/10 text-primary",
            (status === "wrong" || status === "revealed") &&
              "bg-destructive/10 text-destructive"
          )}
        >
          <p className="font-semibold flex items-center gap-1.5">
            {status === "correct" && (<><Check className="h-4 w-4" /> Chính xác!</>)}
            {status === "close" && (<><Check className="h-4 w-4" /> Gần đúng!</>)}
            {status === "wrong" && (<><X className="h-4 w-4" /> Chưa đúng, thử lại nhé!</>)}
            {status === "revealed" && (<><X className="h-4 w-4" /> Đáp án đúng:</>)}
          </p>

          {(status === "close" || status === "revealed" || status === "correct") && (
            <p className="flex items-center gap-2 text-foreground">
              <span>{status === "close" ? "Đáp án mẫu: " : ""}{best}</span>
              <button
                onClick={() => speak(best)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Nghe"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </p>
          )}

          {answered && otherAnswers.length > 0 && (
            <p className="text-muted-foreground">
              Cách khác: {otherAnswers.join(" · ")}
            </p>
          )}
        </div>
      )}

      {/* nút */}
      <div className="flex items-center justify-between gap-2">
        {!answered ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(true)}
              disabled={showHint}
            >
              <Lightbulb className="h-4 w-4 mr-1" /> Gợi ý
            </Button>
            <Button onClick={check} disabled={!input.trim()}>
              Kiểm tra
            </Button>
          </>
        ) : (
          <Button className="ml-auto" onClick={next}>
            {index + 1 >= total ? "Xem kết quả" : "Câu tiếp"}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Enter để kiểm tra / sang câu tiếp · Shift + Enter để xuống dòng
      </p>
    </div>
  );
}