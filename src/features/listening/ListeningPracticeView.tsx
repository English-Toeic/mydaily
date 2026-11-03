import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Check, ChevronRight, ImageOff, Pause, Play, RotateCcw, Shuffle, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CHOICE_KEYS,
  isChoiceKey,
  type ChoiceKey,
  type ListeningQuestion,
  type ListeningScope,
  type ListeningSet,
} from "@/types/listening";

interface Props {
  set: ListeningSet;
  /** Câu của bộ đề, đã sắp theo sort_order */
  questions: ListeningQuestion[];
  onBack: () => void;
  /** Gọi khi bắt đầu một lượt học */
  onStart: () => void;
  /** Gọi khi trả lời một câu, dùng để đánh dấu đã học */
  onAnswer: (q: ListeningQuestion) => void;
  onActivity?: () => void;
}

type Phase = "setup" | "play" | "done";
interface Answer {
  question: ListeningQuestion;
  picked: ChoiceKey;
}

const SHUFFLE_KEY = "listening:shuffle";
const RATE_KEY = "listening:rate";
const RATES = [0.5, 0.75, 1, 1.25] as const;

function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function readStorage<T>(key: string, fallback: T, parse: (raw: string) => T | null): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function ListeningPracticeView({ set, questions, onBack, onStart, onAnswer, onActivity }: Props) {
  const [phase, setPhase] = useState<Phase>("setup");
  // Chụp lại danh sách câu lúc bắt đầu, để việc đánh dấu "đã học" không làm đổi hàng đợi
  const [queue, setQueue] = useState<ListeningQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<ChoiceKey | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const [shuffle, setShuffle] = useState(() => readStorage(SHUFFLE_KEY, true, (s) => s === "1"));
  const [rate, setRate] = useState(() =>
    readStorage<number>(RATE_KEY, 1, (s) => (RATES.includes(Number(s) as never) ? Number(s) : null))
  );

  const changeShuffle = (v: boolean) => {
    setShuffle(v);
    localStorage.setItem(SHUFFLE_KEY, v ? "1" : "0");
  };
  const changeRate = (r: number) => {
    setRate(r);
    localStorage.setItem(RATE_KEY, String(r));
  };

  const current = queue[index] as ListeningQuestion | undefined;

  const start = (list: ListeningQuestion[]) => {
    if (!list.length) return;
    setQueue(shuffle ? shuffled(list) : list);
    setIndex(0);
    setPicked(null);
    setAnswers([]);
    setPhase("play");
    onStart();
    onActivity?.();
  };

  const choose = (key: ChoiceKey) => {
    if (!current || picked) return;
    setPicked(key);
    setAnswers((prev) => [...prev, { question: current, picked: key }]);
    onAnswer(current);
    onActivity?.();
  };

  const next = () => {
    if (!picked) return;
    onActivity?.();
    if (index + 1 >= queue.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Phím tắt: A-D hoặc 1-4 để chọn, Enter để sang câu tiếp
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const upper = e.key.toUpperCase();
      const numIdx = ["1", "2", "3", "4"].indexOf(e.key);
      const key = isChoiceKey(upper) ? upper : numIdx >= 0 ? CHOICE_KEYS[numIdx] : null;
      if (key && !picked) {
        e.preventDefault();
        choose(key);
        return;
      }
      if (e.key === "Enter" && picked) {
        // Nút đang focus sẽ tự nhận Enter, tránh chuyển 2 câu một lúc
        if (e.target instanceof HTMLElement && e.target.closest("button")) return;
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const isLast = index + 1 >= queue.length;
  const isCorrect = picked !== null && current && picked === current.correct;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Nghe & chọn đáp án</p>
          <h1 className="truncate text-lg font-semibold">{set.title}</h1>
        </div>
      </div>

      {phase === "setup" && (
        <SetupScreen
          questions={questions}
          shuffle={shuffle}
          onShuffleChange={changeShuffle}
          onStart={start}
        />
      )}

      {phase === "play" && current && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="tabular-nums">
              Câu {index + 1}/{queue.length}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((index + (picked ? 1 : 0)) / queue.length) * 100}%` }}
              />
            </div>
          </div>

          {current.image_url && <QuestionImage key={`img-${current.id}`} src={current.image_url} />}

          <AudioPlayer
            key={`audio-${current.id}`}
            src={current.audio_url}
            rate={rate}
            onRateChange={changeRate}
            onPlay={onActivity}
          />

          <ChoiceList question={current} picked={picked} onPick={choose} />

          {picked && (
            <div className="flex items-center gap-3">
              <p
                className={cn(
                  "flex-1 text-sm font-medium",
                  isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {isCorrect ? "Chính xác!" : `Sai rồi, đáp án đúng là ${current.correct}`}
              </p>
              <Button onClick={next} autoFocus>
                {isLast ? "Xem kết quả" : "Câu tiếp"}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <ResultScreen
          answers={answers}
          onRetryWrong={(list) => start(list)}
          onRestart={() => setPhase("setup")}
          onBack={onBack}
        />
      )}
    </div>
  );
}

// ======================= Màn chuẩn bị =======================

function SetupScreen({
  questions, shuffle, onShuffleChange, onStart,
}: {
  questions: ListeningQuestion[];
  shuffle: boolean;
  onShuffleChange: (v: boolean) => void;
  onStart: (list: ListeningQuestion[]) => void;
}) {
  const unlearned = questions.filter((q) => !q.learned_at);
  const [scope, setScope] = useState<ListeningScope>(unlearned.length ? "new" : "all");
  const list = scope === "new" ? unlearned : questions;

  if (questions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Bộ đề này chưa có câu nào.
      </p>
    );
  }

  const options: [ListeningScope, string, number][] = [
    ["new", "Câu chưa học", unlearned.length],
    ["all", "Tất cả", questions.length],
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {options.map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            disabled={count === 0}
            onClick={() => setScope(id)}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
              scope === id ? "border-primary bg-primary/5" : "hover:border-primary/40"
            )}
          >
            <p className="text-2xl font-bold tabular-nums">{count}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-pressed={shuffle}
        onClick={() => onShuffleChange(!shuffle)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
          shuffle ? "border-primary/50 bg-primary/5" : "hover:bg-muted/50"
        )}
      >
        <Shuffle className={cn("size-5", shuffle ? "text-primary" : "text-muted-foreground")} />
        <span className="flex-1 text-sm font-medium">Xáo trộn thứ tự câu</span>
        <span
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            shuffle ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
              shuffle ? "left-4.5" : "left-0.5"
            )}
          />
        </span>
      </button>

      {unlearned.length === 0 && (
        <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
          🎉 Bạn đã học hết bộ đề này. Có thể ôn lại tất cả.
        </p>
      )}

      <Button className="w-full" size="lg" disabled={!list.length} onClick={() => onStart(list)}>
        <Play className="size-4" />
        Bắt đầu ({list.length} câu)
      </Button>
    </div>
  );
}

// ======================= Ảnh =======================

function QuestionImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex aspect-video items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground">
        <ImageOff className="size-5" />
        Không tải được ảnh
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border bg-muted/30">
      <img
        src={src}
        alt="Ảnh câu hỏi"
        referrerPolicy="no-referrer"
        className="mx-auto max-h-[45vh] w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// ======================= Audio =======================

function AudioPlayer({
  src, rate, onRateChange, onPlay,
}: {
  src: string;
  rate: number;
  onRateChange: (r: number) => void;
  onPlay?: () => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.defaultPlaybackRate = rate;
    a.playbackRate = rate;
  }, [rate]);

  // Dừng audio khi rời câu hoặc rời màn hình
  useEffect(() => {
    const a = ref.current;
    return () => a?.pause();
  }, []);

  const play = (fromStart: boolean) => {
    const a = ref.current;
    if (!a) return;
    if (fromStart) a.currentTime = 0;
    a.playbackRate = rate;
    void a.play().catch(() => {}); // lỗi tải file được xử lý ở onError
  };

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) play(false);
    else a.pause();
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <audio
        ref={ref}
        src={src}
        preload="auto"
        onPlay={() => {
          setPlaying(true);
          onPlay?.();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(1);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setProgress(a.duration ? a.currentTime / a.duration : 0);
        }}
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = rate;
        }}
        onError={() => setFailed(true)}
      />

      <Button
        size="icon"
        className="size-12 shrink-0 rounded-full"
        onClick={toggle}
        disabled={failed}
        aria-label={playing ? "Tạm dừng" : "Phát"}
      >
        {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
      </Button>

      <div className="min-w-0 flex-1 space-y-2">
        {failed ? (
          <p className="text-sm text-destructive">Không tải được audio, kiểm tra lại link</p>
        ) : (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => play(true)} disabled={failed}>
            <RotateCcw className="size-4" />
            Nghe lại
          </Button>
          <div className="ml-auto flex gap-0.5 rounded-md bg-muted p-0.5">
            {RATES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRateChange(r)}
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium tabular-nums transition",
                  r === rate ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================= Đáp án =======================

function ChoiceList({
  question, picked, onPick,
}: {
  question: ListeningQuestion;
  picked: ChoiceKey | null;
  onPick: (k: ChoiceKey) => void;
}) {
  // Chưa chọn: chỉ hiện 4 nút A B C D
  if (!picked) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {CHOICE_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onPick(k)}
            className="h-16 rounded-xl border-2 bg-card text-2xl font-bold transition hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
          >
            {k}
          </button>
        ))}
      </div>
    );
  }

  // Đã chọn: hiện text EN + VI của cả 4 đáp án
  return (
    <ul className="space-y-2">
      {question.choices.map((c) => {
        const correct = c.key === question.correct;
        const wrongPick = c.key === picked && !correct;
        return (
          <li
            key={c.key}
            className={cn(
              "flex items-start gap-3 rounded-xl border-2 p-3",
              correct
                ? "border-emerald-500 bg-emerald-500/10"
                : wrongPick
                  ? "border-red-500 bg-red-500/10"
                  : "border-transparent bg-muted/40"
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                correct
                  ? "bg-emerald-500 text-white"
                  : wrongPick
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {correct ? <Check className="size-4" /> : wrongPick ? <X className="size-4" /> : c.key}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                <span className="text-muted-foreground">{c.key}.</span> {c.en}
              </p>
              {c.vi && <p className="text-sm text-muted-foreground">{c.vi}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ======================= Tổng kết =======================

function ResultScreen({
  answers, onRetryWrong, onRestart, onBack,
}: {
  answers: Answer[];
  onRetryWrong: (list: ListeningQuestion[]) => void;
  onRestart: () => void;
  onBack: () => void;
}) {
  const wrong = answers.filter((a) => a.picked !== a.question.correct);
  const correct = answers.length - wrong.length;
  const pct = answers.length ? Math.round((correct / answers.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Kết quả</p>
        <p
          className={cn(
            "text-5xl font-bold tabular-nums",
            pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"
          )}
        >
          {correct}/{answers.length}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Đúng {pct}%</p>
      </div>

      {wrong.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Câu sai ({wrong.length})</h2>
          <ul className="space-y-2">
            {wrong.map(({ question: q, picked }) => {
              const right = q.choices.find((c) => c.key === q.correct);
              const mine = q.choices.find((c) => c.key === picked);
              return (
                <li key={q.id} className="flex gap-3 rounded-xl border bg-card p-3">
                  {q.image_url && (
                    <img
                      src={q.image_url}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="size-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <p className="text-red-600 dark:text-red-400">
                      Bạn chọn {picked}. {mine?.en}
                    </p>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">
                      Đúng {q.correct}. {right?.en}
                    </p>
                    {right?.vi && <p className="text-muted-foreground">{right.vi}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {wrong.length > 0 && (
          <Button className="flex-1" onClick={() => onRetryWrong(wrong.map((a) => a.question))}>
            <RotateCcw className="size-4" />
            Làm lại câu sai
          </Button>
        )}
        <Button className="flex-1" variant="outline" onClick={onRestart}>
          Học lượt mới
        </Button>
        <Button className="flex-1" variant="ghost" onClick={onBack}>
          Về danh sách
        </Button>
      </div>
    </div>
  );
}