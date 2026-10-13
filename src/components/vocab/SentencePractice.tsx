import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  AlertTriangle, Check, ChevronRight, Lightbulb, RotateCcw, Trophy, Volume2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { keepInputFocus } from "@/lib/keepInputFocus";
import type { Word } from "@/types/vocab";
import { checkSentence, makeHint, normalize, type SentenceVerdict } from "@/lib/sentences";
import { useCtrlTap } from "./useCtrlTap";

type Phase = "answering" | "retry" | "checked";

interface Result {
  vi: string;
  input: string;
  best: string;
  verdict: SentenceVerdict;
}

interface Props {
  word: Word;
  speak: (text: string) => void;
  speaking: boolean;
  autoSpeak: boolean;
  onDone: () => void;
}

const TONES = {
  correct: {
    Icon: Check,
    dot: "bg-emerald-500",
    box: "border-emerald-500/30 bg-emerald-500/[0.06]",
    text: "text-emerald-700 dark:text-emerald-300",
    input: "border-emerald-500 bg-emerald-500/5",
  },
  almost: {
    Icon: AlertTriangle,
    dot: "bg-amber-500",
    box: "border-amber-500/30 bg-amber-500/[0.06]",
    text: "text-amber-700 dark:text-amber-300",
    input: "border-amber-500 bg-amber-500/5",
  },
  wrong: {
    Icon: X,
    dot: "bg-red-500",
    box: "border-red-500/30 bg-red-500/[0.06]",
    text: "text-red-700 dark:text-red-300",
    input: "border-red-500 bg-red-500/5",
  },
} as const;

export function SentencePractice({ word, speak, speaking, autoSpeak, onDone }: Props) {
  const sentences = word.sentences ?? [];
  const total = sentences.length;

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const [verdict, setVerdict] = useState<SentenceVerdict | null>(null);
  const [best, setBest] = useState("");
  const [hinted, setHinted] = useState(false);
  const [overridden, setOverridden] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const current = sentences[index];
  const checked = phase === "checked";

  // Ctrl: nghe lại đáp án (chỉ sau khi đã kiểm tra, tránh lộ đáp án)
  useCtrlTap(() => {
    if (checked && best) speak(best);
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  const resetCard = () => {
    setInput("");
    setPhase("answering");
    setVerdict(null);
    setBest("");
    setHinted(false);
    setOverridden(false);
    setShaking(false);
  };

  const finish = (v: SentenceVerdict, answer: string) => {
    setVerdict(v);
    setBest(answer);
    setPhase("checked");
    if (v === "wrong") setShaking(true);
    if (autoSpeak) speak(answer);
  };

  const check = () => {
    if (checked || !input.trim()) return;
    const r = checkSentence(input, current.en, word.english);
    if (r.verdict !== "wrong") return finish(r.verdict, r.best);

    // Sai lần 1 → cho sửa lại; sai lần 2 → hiện đáp án
    if (phase === "answering") {
      setPhase("retry");
      setVerdict("wrong");
      setBest(r.best);
      setShaking(true);
      return;
    }
    finish("wrong", r.best);
  };

  const giveUp = () => {
    if (!checked) finish("wrong", best || current.en[0]);
  };

  const override = () => {
    setVerdict("correct");
    setOverridden(true);
  };

  const next = () => {
    if (!checked || !verdict) return;
    setResults((prev) => [...prev, { vi: current.vi, input: input.trim(), best, verdict }]);
    setIndex((i) => i + 1);
    resetCard();
  };

  const restart = () => {
    setResults([]);
    setIndex(0);
    resetCard();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter xuống dòng; bỏ qua khi bộ gõ đang ghép chữ
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (checked) next();
    else check();
  };

  if (total === 0) return null;

  if (index >= total) {
    return (
      <PracticeSummary word={word} results={results} speak={speak} onRestart={restart} onDone={onDone} />
    );
  }

  const tone = verdict ? TONES[verdict] : null;
  const VerdictIcon = tone?.Icon;
  const others = checked ? current.en.filter((a) => a !== best) : [];

  const title =
    verdict === "wrong" ? (input.trim() ? "Chưa đúng" : "Không sao, ghi nhớ nhé")
    : verdict === "almost" ? "Gần đúng, so sánh với đáp án mẫu"
    : overridden ? "Đã tính là đúng"
    : hinted ? "Đúng, nhưng đã dùng gợi ý"
    : "Chính xác! 🎉";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-4 sm:py-8">
      {/* Header */}
      <header className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold leading-tight">Luyện câu</h1>
          <p className="text-xs text-muted-foreground">
            Câu {index + 1}/{total} · dịch sang tiếng Anh
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          {...keepInputFocus}
          onClick={onDone}
          className="shrink-0 rounded-full text-muted-foreground"
        >
          Bỏ qua
        </Button>
      </header>

      {/* Tiến độ từng câu */}
      <div className="flex gap-1.5" aria-label={`Câu ${index + 1} trên ${total}`}>
        {sentences.map((_, i) => {
          const r = results[i];
          return (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors duration-300",
                r ? TONES[r.verdict].dot : i === index ? "bg-primary/40" : "bg-muted"
              )}
            />
          );
        })}
      </div>

      {/* Thẻ câu */}
      <section className="relative rounded-3xl border bg-linear-to-b from-primary/[0.07] via-card to-card px-6 pb-8 pt-12 text-center shadow-sm">
        <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
          <span lang="en" className="font-semibold">{word.english}</span> · {word.meaning}
        </span>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Dịch câu này sang tiếng Anh
        </p>
        <p lang="vi" className="mt-3 wrap-break-word text-2xl font-semibold leading-snug">
          {current.vi}
        </p>
        {hinted && !checked && (
          <p lang="en" aria-label="Gợi ý" className="mt-5 font-mono text-base tracking-wide text-primary">
            {makeHint(current.en[0])}
          </p>
        )}
      </section>

      {/* Ô nhập */}
      <div className="space-y-3">
        <div
          onAnimationEnd={() => setShaking(false)}
          className={cn("relative", shaking && "animate-shake motion-reduce:animate-none")}
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (phase === "retry") setVerdict(null); // gõ lại thì bỏ viền đỏ
            }}
            onKeyDown={onKeyDown}
            readOnly={checked}
            enterKeyHint={checked ? "next" : "done"}
            lang="en"
            placeholder="Viết câu tiếng Anh…"
            aria-label="Câu trả lời"
            aria-invalid={verdict === "wrong"}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              "block min-h-22 w-full resize-none rounded-2xl border-2 bg-background px-4 py-3 pr-12 text-lg leading-snug outline-none transition-all placeholder:text-muted-foreground/60",
              !tone && "border-input focus:border-primary focus:ring-4 focus:ring-primary/15",
              tone && cn(tone.input, tone.text)
            )}
          />
          {tone && VerdictIcon && (
            <span className={cn("absolute right-3 top-3 grid size-7 place-items-center rounded-full text-white", tone.dot)}>
              <VerdictIcon className="size-4" strokeWidth={3} />
            </span>
          )}
        </div>

        {/* Sai lần 1 */}
        {phase === "retry" && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/6 px-4 py-3">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Chưa đúng, sửa lại thử nhé!
            </p>
            <button
              type="button"
              {...keepInputFocus}
              onClick={giveUp}
              className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border transition hover:bg-background hover:text-foreground touch-manipulation"
            >
              Xem đáp án
            </button>
          </div>
        )}

        {/* Kết quả */}
        {checked && tone && (
          <div role="status" className={cn("rounded-2xl border p-4", tone.box)}>
            <div className="flex items-start justify-between gap-3">
              <p className={cn("font-semibold", tone.text)}>{title}</p>
              {verdict === "wrong" && input.trim() && (
                <button
                  type="button"
                  {...keepInputFocus}
                  onClick={override}
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border transition hover:bg-background hover:text-foreground touch-manipulation"
                >
                  Tôi đúng
                </button>
              )}
            </div>

            <div className="mt-3 flex items-start gap-2">
              <AnswerDiff answer={best} input={input} highlight={verdict !== "correct" && !!input.trim()} />
              <button
                type="button"
                {...keepInputFocus}
                onClick={() => speak(best)}
                aria-label="Nghe đáp án"
                className="mt-0.5 shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground active:scale-95 touch-manipulation"
              >
                <Volume2 className={cn("size-4", speaking && "animate-pulse text-primary")} />
              </button>
            </div>

            {verdict !== "correct" && input.trim() && (
              <p className="mt-1 text-xs text-muted-foreground">Từ được tô đỏ là chỗ bạn viết thiếu hoặc sai.</p>
            )}

            {others.length > 0 && (
              <p lang="en" className="mt-3 border-t border-current/10 pt-2 text-sm text-muted-foreground">
                Cách khác: {others.join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hành động */}
      <div className="flex gap-2">
        {!checked ? (
          <>
            <Button
              variant="outline"
              {...keepInputFocus}
              onClick={() => setHinted(true)}
              disabled={hinted}
              className="h-12 rounded-xl px-4 touch-manipulation"
            >
              <Lightbulb className="size-4" />
              <span className="hidden min-[400px]:inline">Gợi ý</span>
            </Button>
            <Button
              variant="ghost"
              {...keepInputFocus}
              onClick={giveUp}
              className="h-12 rounded-xl px-3 text-muted-foreground touch-manipulation"
            >
              Không biết
            </Button>
            <Button
              {...keepInputFocus}
              onClick={check}
              disabled={!input.trim()}
              className="h-12 flex-1 rounded-xl text-base touch-manipulation"
            >
              Kiểm tra
            </Button>
          </>
        ) : (
          <Button
            {...keepInputFocus}
            onClick={next}
            className="h-12 flex-1 rounded-xl text-base touch-manipulation"
          >
            {index + 1 >= total ? "Xem kết quả" : "Câu tiếp"} <ChevronRight className="size-4" />
          </Button>
        )}
      </div>

      <p className="hidden items-center justify-center gap-3 text-xs text-muted-foreground sm:flex">
        <span><Kbd>Enter</Kbd> {checked ? "tiếp tục" : "kiểm tra"}</span>
        <span className="text-border">|</span>
        <span><Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> xuống dòng</span>
        {checked && (
          <>
            <span className="text-border">|</span>
            <span><Kbd>Ctrl</Kbd> nghe lại</span>
          </>
        )}
      </p>
    </div>
  );
}

/* ---------- Đáp án có tô đỏ các từ người dùng viết thiếu/sai ---------- */

function AnswerDiff({ answer, input, highlight }: { answer: string; input: string; highlight: boolean }) {
  const userTokens = useMemo(() => new Set(normalize(input)), [input]);
  return (
    <p lang="en" className="flex-1 text-lg font-semibold leading-snug">
      {answer.split(/\s+/).map((w, i) => {
        const toks = normalize(w);
        const missing = highlight && toks.length > 0 && toks.some((t) => !userTokens.has(t));
        return (
          <Fragment key={i}>
            <span
              className={cn(
                missing &&
                  "rounded bg-red-500/15 px-0.5 text-red-700 underline decoration-red-500/50 decoration-2 underline-offset-4 dark:text-red-300"
              )}
            >
              {w}
            </span>{" "}
          </Fragment>
        );
      })}
    </p>
  );
}

/* ---------- Màn tổng kết 5 câu ---------- */

function PracticeSummary({
  word, results, speak, onRestart, onDone,
}: {
  word: Word;
  results: Result[];
  speak: (text: string) => void;
  onRestart: () => void;
  onDone: () => void;
}) {
  const score = results.filter((r) => r.verdict !== "wrong").length;
  const perfect = score === results.length;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-4 sm:py-8">
      <section className="rounded-3xl border bg-linear-to-b from-primary/[0.07] via-card to-card px-6 py-8 text-center shadow-sm">
        <Trophy className={cn("mx-auto size-12", perfect ? "text-amber-500" : "text-primary")} />
        <h2 className="mt-3 text-2xl font-bold">{perfect ? "Xuất sắc!" : "Hoàn thành!"}</h2>
        <p className="mt-1 text-muted-foreground">
          Bạn dịch đúng{" "}
          <span className="font-semibold tabular-nums text-foreground">{score}/{results.length}</span>{" "}
          câu với từ <span lang="en" className="font-semibold text-foreground">{word.english}</span>
        </p>
      </section>

      <ul className="space-y-2">
        {results.map((r, i) => {
          const tone = TONES[r.verdict];
          const Icon = tone.Icon;
          return (
            <li key={i} className={cn("rounded-2xl border p-3", tone.box)}>
              <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-white", tone.dot)}>
                  <Icon className="size-3" strokeWidth={3} />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p lang="vi" className="text-sm text-muted-foreground">{r.vi}</p>
                  <p lang="en" className="font-medium">{r.best}</p>
                  {r.verdict !== "correct" && r.input && (
                    <p lang="en" className="text-sm text-muted-foreground">
                      Bạn viết: <span className={tone.text}>{r.input}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => speak(r.best)}
                  aria-label="Nghe"
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
                >
                  <Volume2 className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onRestart} className="h-12 rounded-xl px-4">
          <RotateCcw className="size-4" /> Làm lại
        </Button>
        <Button autoFocus onClick={onDone} className="h-12 flex-1 rounded-xl text-base">
          Tiếp tục học <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}