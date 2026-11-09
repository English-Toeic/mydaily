import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Check, ChevronRight, ImageOff, Keyboard, Pause, Play, Rewind, RotateCcw, Shuffle, X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gradeText, sumGrades, type TextGrade } from "@/lib/textDiff";
import {
  CHOICE_KEYS,
  isChoiceKey,
  type ChoiceKey,
  type ListeningQuestion,
  type ListeningScope,
  type ListeningSet,
} from "@/types/listening";
import { keepInputFocus } from "@/lib/keepInputFocus";

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
type Texts = Record<ChoiceKey, string>;
type Grades = Partial<Record<ChoiceKey, TextGrade>>;

interface Answer {
  question: ListeningQuestion;
  picked: ChoiceKey;
  /** null khi tắt chế độ chép */
  grades: Grades | null;
}

const SHUFFLE_KEY = "listening:shuffle";
const RATE_KEY = "listening:rate";
const TYPE_KEY = "listening:type";
const RATES = [0.5, 0.75, 1, 1.25] as const;
const DIGIT_CODES = ["Digit1", "Digit2", "Digit3", "Digit4"];

const emptyTexts = (): Texts => Object.fromEntries(CHOICE_KEYS.map((k) => [k, ""])) as Texts;

const gradesOf = (g: Grades | null): TextGrade[] =>
  g ? Object.values(g).filter((x): x is TextGrade => !!x) : [];

/** Chọn sai, hoặc chép chưa đúng hết một đáp án nào đó */
const needsReview = (a: Answer) =>
  a.picked !== a.question.correct || gradesOf(a.grades).some((g) => !g.exact);

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
  const [texts, setTexts] = useState<Texts>(emptyTexts);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [shuffle, setShuffle] = useState(() => readStorage(SHUFFLE_KEY, true, (s) => s === "1"));
  const [typeMode, setTypeMode] = useState(() => readStorage(TYPE_KEY, true, (s) => s === "1"));
  const [rate, setRate] = useState(() =>
    readStorage<number>(RATE_KEY, 1, (s) => (RATES.includes(Number(s) as never) ? Number(s) : null))
  );

  const changeShuffle = (v: boolean) => {
    setShuffle(v);
    localStorage.setItem(SHUFFLE_KEY, v ? "1" : "0");
  };
  const changeTypeMode = (v: boolean) => {
    setTypeMode(v);
    localStorage.setItem(TYPE_KEY, v ? "1" : "0");
  };
  const changeRate = (r: number) => {
    setRate(r);
    localStorage.setItem(RATE_KEY, String(r));
  };

  const current = queue[index] as ListeningQuestion | undefined;
  const currentAnswer = checked ? answers[answers.length - 1] : undefined;

  const resetQuestion = () => {
    setPicked(null);
    setTexts(emptyTexts());
    setChecked(false);
  };

  const start = (list: ListeningQuestion[]) => {
    if (!list.length) return;
    setQueue(shuffle ? shuffled(list) : list);
    setIndex(0);
    resetQuestion();
    setAnswers([]);
    setPhase("play");
    onStart();
    onActivity?.();
  };

  const submit = (key: ChoiceKey) => {
    if (!current || checked) return;
    const grades: Grades | null = typeMode
      ? Object.fromEntries(current.choices.map((c) => [c.key, gradeText(c.en, texts[c.key] ?? "")]))
      : null;
    setPicked(key);
    setChecked(true);
    setAnswers((prev) => [...prev, { question: current, picked: key, grades }]);
    onAnswer(current);
    onActivity?.();
  };

  /** Chế độ chép: chỉ đánh dấu lựa chọn, đổi được. Chế độ thường: chấm luôn */
  const choose = (key: ChoiceKey) => {
    if (checked) return;
    if (!typeMode) {
      submit(key);
      return;
    }
    setPicked(key);
    onActivity?.();
  };

  const check = () => {
    if (picked) submit(picked);
  };

  const next = () => {
    if (!checked) return;
    onActivity?.();
    if (index + 1 >= queue.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    resetQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const retry = () => {
    if (!checked) return;
    // Câu vừa chấm luôn là phần tử cuối của answers → bỏ đi, lần làm lại sẽ ghi đè
    setAnswers((prev) => prev.slice(0, -1));
    resetQuestion();
    setAttempt((n) => n + 1);
    onActivity?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Phím tắt:
  //  - A-D / 1-4 (khi không ở ô nhập), Alt+1-4 (mọi lúc): chọn đáp án
  //  - Enter: kiểm tra / sang câu tiếp
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      const inField = !!target?.closest("input, textarea, [contenteditable='true']");

      // Dùng e.code vì trên macOS, Alt+số sinh ra ký tự đặc biệt
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const i = DIGIT_CODES.indexOf(e.code);
        if (i >= 0 && !checked) {
          e.preventDefault();
          choose(CHOICE_KEYS[i]);
        }
        return;
      }
      if (e.ctrlKey || e.metaKey) return;

      if (e.key === "Enter") {
        if (inField) return; // ô nhập tự xử lý Enter
        // Nút đang focus tự nhận Enter (tránh chuyển 2 câu một lúc); riêng nút A-D thì Enter = kiểm tra
        if (target?.closest("button") && !target.closest("[data-choice]")) return;
        e.preventDefault();
        if (checked) next();
        else check();
        return;
      }

       if (checked && !inField && e.key.toLowerCase() === "r") {
        e.preventDefault();
        retry();
        return;
      }

      if (inField || checked) return;
      const upper = e.key.toUpperCase();
      const numIdx = ["1", "2", "3", "4"].indexOf(e.key);
      const key = isChoiceKey(upper) ? upper : numIdx >= 0 ? CHOICE_KEYS[numIdx] : null;
      if (key) {
        e.preventDefault();
        choose(key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const isLast = index + 1 >= queue.length;
  const isCorrect = checked && picked !== null && current && picked === current.correct;
  const currentStats = currentAnswer?.grades ? sumGrades(gradesOf(currentAnswer.grades)) : null;

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
          typeMode={typeMode}
          onTypeModeChange={changeTypeMode}
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
                style={{ width: `${((index + (checked ? 1 : 0)) / queue.length) * 100}%` }}
              />
            </div>
          </div>

          {current.image_url && <QuestionImage key={`img-${current.id}`} src={current.image_url} />}

          <AudioPlayer
            key={`${current.id}-${attempt}`}
            src={current.audio_url}
            rate={rate}
            onRateChange={changeRate}
            onPlay={onActivity}
          />

          {typeMode && !checked ? (
            <>
              <ChoiceInputs
                key={`inputs-${index}`}
                texts={texts}
                picked={picked}
                onTextChange={(k, v) => setTexts((prev) => ({ ...prev, [k]: v }))}
                onPick={choose}
                onSubmit={check}
              />
              <div className="flex items-center gap-3">
                <p className="flex-1 text-xs text-muted-foreground">
                  {picked ? (
                    <>
                      Đã chọn <b className="text-foreground">{picked}</b>. Nhấn Enter hoặc bấm Kiểm tra
                    </>
                  ) : (
                    "Bấm nút A–D (hoặc Alt+1–4) để chọn đáp án đúng · Ctrl+Space: phát/dừng"
                  )}
                </p>
                <Button onClick={check} disabled={!picked}>
                  Kiểm tra
                </Button>
              </div>
            </>
          ) : (
            <ChoiceList
              question={current}
              picked={checked ? picked : null}
              grades={currentAnswer?.grades ?? null}
              onPick={choose}
            />
          )}

          {checked && picked && (
            <div
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border p-3",
                isCorrect ? "border-emerald-500/40 bg-emerald-500/5" : "border-red-500/40 bg-red-500/5"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className={cn("font-semibold", isCorrect ? "text-emerald-600" : "text-red-600")}>
                  {isCorrect ? "Chính xác!" : `Sai rồi, đáp án đúng là ${current.correct}`}
                </p>
                {currentStats && (
                  <p className="text-sm text-muted-foreground">
                    Chép đúng {currentStats.matched}/{currentStats.total} từ ({currentStats.pct}%)
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={retry} title="Học lại câu này (phím R)">
                  <RotateCcw className="size-4" />
                  Học lại
                </Button>
                <Button onClick={next} autoFocus>
                  {isLast ? "Xem kết quả" : "Câu tiếp"}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <ResultScreen
          answers={answers}
          onRetry={(list) => start(list)}
          onRestart={() => setPhase("setup")}
          onBack={onBack}
        />
      )}
    </div>
  );
}

// ======================= Màn chuẩn bị =======================

function ToggleRow({
  icon: Icon, label, hint, checked, onChange,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
        checked ? "border-primary/50 bg-primary/5" : "hover:bg-muted/50"
      )}
    >
      <Icon className={cn("size-5 shrink-0", checked ? "text-primary" : "text-muted-foreground")} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
            checked ? "left-4.5" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

function SetupScreen({
  questions, shuffle, onShuffleChange, typeMode, onTypeModeChange, onStart,
}: {
  questions: ListeningQuestion[];
  shuffle: boolean;
  onShuffleChange: (v: boolean) => void;
  typeMode: boolean;
  onTypeModeChange: (v: boolean) => void;
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

      <div className="space-y-2">
        <ToggleRow icon={Shuffle} label="Xáo trộn thứ tự câu" checked={shuffle} onChange={onShuffleChange} />
        <ToggleRow
          icon={Keyboard}
          label="Chép lời đáp án"
          hint="Gõ lại lời 4 đáp án A–D trước khi chọn, chấm cả chính tả"
          checked={typeMode}
          onChange={onTypeModeChange}
        />
      </div>

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

// ======================= Ảnh & Audio =======================
// QuestionImage và AudioPlayer: GIỮ NGUYÊN như code hiện tại

// ======================= Nhập lời đáp án =======================

function ChoiceInputs({
  texts, picked, onTextChange, onPick, onSubmit,
}: {
  texts: Texts;
  picked: ChoiceKey | null;
  onTextChange: (k: ChoiceKey, v: string) => void;
  onPick: (k: ChoiceKey) => void;
  onSubmit: () => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  return (
    <ul className="space-y-2">
      {CHOICE_KEYS.map((k, i) => (
        <li key={k} className="flex items-center gap-2">
          <button
            type="button"
            data-choice
            aria-pressed={picked === k}
            aria-label={`Chọn đáp án ${k}`}
            onClick={() => onPick(k)}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl border-2 text-lg font-bold transition active:scale-95",
              picked === k
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:border-primary hover:bg-primary/5"
            )}
          >
            {k}
          </button>
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            autoFocus={i === 0}
            value={texts[k]}
            onChange={(e) => onTextChange(k, e.target.value)}
            onKeyDown={(e) => {
              // isComposing: đang gõ dở bằng bộ gõ tiếng Việt / IME
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              const nextInput = refs.current[i + 1];
              if (nextInput) nextInput.focus();
              else onSubmit();
            }}
            placeholder={`Chép lời đáp án ${k}`}
            aria-label={`Lời đáp án ${k}`}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </li>
      ))}
    </ul>
  );
}

// ======================= Hiển thị phần đã chép =======================

function TypedLine({ grade }: { grade: TextGrade }) {
  if (grade.exact) {
    return (
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <Check className="size-3.5" /> Chép đúng
      </p>
    );
  }

  const typedAny = grade.tokens.some((t) => t.kind !== "miss");
  return (
    <p className="mt-1.5 rounded-lg bg-background/70 px-2 py-1 text-sm leading-relaxed">
      <span className="mr-1.5 text-xs text-muted-foreground">Bạn chép:</span>
      {typedAny ? (
        grade.tokens.map((t, i) => (
          <Fragment key={i}>
            <span
              className={cn(
                t.kind === "extra" && "text-red-600 line-through decoration-2 dark:text-red-400",
                t.kind === "miss" &&
                  "rounded bg-amber-500/15 px-1 text-amber-700 underline decoration-dotted dark:text-amber-400"
              )}
            >
              {t.text}
            </span>{" "}
          </Fragment>
        ))
      ) : (
        <span className="italic text-muted-foreground">bỏ trống</span>
      )}
      <span className="ml-1 text-xs tabular-nums text-muted-foreground">({grade.pct}%)</span>
    </p>
  );
}

// ======================= Đáp án =======================

function ChoiceList({
  question, picked, grades, onPick,
}: {
  question: ListeningQuestion;
  picked: ChoiceKey | null;
  grades: Grades | null;
  onPick: (k: ChoiceKey) => void;
}) {
  // Chế độ thường, chưa chọn: chỉ hiện 4 nút A B C D
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

  // Đã chấm: hiện text EN + VI của 4 đáp án, kèm phần đã chép
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {question.choices.map((c) => {
          const correct = c.key === question.correct;
          const wrongPick = c.key === picked && !correct;
          const grade = grades?.[c.key];
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
                {grade && <TypedLine grade={grade} />}
              </div>
            </li>
          );
        })}
      </ul>
      {grades && (
        <p className="text-xs text-muted-foreground">
          <span className="text-red-600 line-through dark:text-red-400">gạch đỏ</span>: từ sai hoặc thừa ·{" "}
          <span className="rounded bg-amber-500/15 px-1 text-amber-700 dark:text-amber-400">nền vàng</span>: từ còn thiếu
        </p>
      )}
    </div>
  );
}

// ======================= Tổng kết =======================

function ResultScreen({
  answers, onRetry, onRestart, onBack,
}: {
  answers: Answer[];
  onRetry: (list: ListeningQuestion[]) => void;
  onRestart: () => void;
  onBack: () => void;
}) {
  const review = answers.filter(needsReview);
  const correct = answers.filter((a) => a.picked === a.question.correct).length;
  const pct = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const allGrades = answers.flatMap((a) => gradesOf(a.grades));
  const typing = allGrades.length ? sumGrades(allGrades) : null;

  const tone = (p: number) => (p >= 80 ? "text-emerald-600" : p >= 50 ? "text-amber-600" : "text-red-600");

  return (
    <div className="space-y-5">
      <div className={cn("grid gap-3", typing && "grid-cols-2")}>
        <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Chọn đáp án</p>
          <p className={cn("text-4xl font-bold tabular-nums", tone(pct))}>
            {correct}/{answers.length}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Đúng {pct}%</p>
        </div>
        {typing && (
          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Chép chính tả</p>
            <p className={cn("text-4xl font-bold tabular-nums", tone(typing.pct))}>{typing.pct}%</p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              {typing.matched}/{typing.total} từ
            </p>
          </div>
        )}
      </div>

      {review.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Cần xem lại ({review.length})</h2>
          <ul className="space-y-2">
            {review.map(({ question: q, picked, grades }) => {
              const right = q.choices.find((c) => c.key === q.correct);
              const mine = q.choices.find((c) => c.key === picked);
              const pickWrong = picked !== q.correct;
              const typos = q.choices.flatMap((c) => {
                const g = grades?.[c.key];
                return g && !g.exact ? [{ choice: c, grade: g }] : [];
              });

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
                    {pickWrong ? (
                      <>
                        <p className="text-red-600 dark:text-red-400">
                          Bạn chọn {picked}. {mine?.en}
                        </p>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">
                          Đúng {q.correct}. {right?.en}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">
                        Chọn đúng {q.correct}. {right?.en}
                      </p>
                    )}
                    {right?.vi && <p className="text-muted-foreground">{right.vi}</p>}

                    {typos.map(({ choice, grade }) => (
                      <div key={choice.key} className="border-t pt-1.5">
                        <p className="text-muted-foreground">
                          <b className="text-foreground">{choice.key}.</b> {choice.en}
                        </p>
                        <TypedLine grade={grade} />
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {review.length > 0 && (
          <Button className="flex-1" onClick={() => onRetry(review.map((a) => a.question))}>
            <RotateCcw className="size-4" />
            Làm lại {review.length} câu
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
function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const REWIND_STEP = 5; // giây

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
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
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

  const syncDuration = (a: HTMLAudioElement) => {
    // Một số file (stream, Drive...) báo duration = Infinity/NaN
    setDuration(Number.isFinite(a.duration) ? a.duration : 0);
  };

  const seek = (t: number) => {
    const a = ref.current;
    if (!a) return;
    a.currentTime = t;
    setCurrent(t); // cập nhật ngay, tránh thanh tua giật về vị trí cũ
  };

  const play = (fromStart: boolean) => {
    const a = ref.current;
    if (!a) return;
    if (fromStart) seek(0);
    a.playbackRate = rate;
    void a.play().catch(() => {}); // lỗi tải file được xử lý ở onError
  };

  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) play(false);
    else a.pause();
  };

  /** Lùi 5 giây rồi phát tiếp (kể cả khi đang dừng hoặc đã phát hết) */
  const rewind = () => {
    const a = ref.current;
    if (!a) return;
    seek(Math.max(0, a.currentTime - REWIND_STEP));
    play(false);
  };

  // Phím tắt phát/dừng:
  //  - Space: chỉ khi KHÔNG ở ô nhập (trong ô nhập Space để gõ dấu cách)
  //  - Esc, Alt+K, Ctrl+Space: dùng được mọi lúc, kể cả khi đang gõ
  useEffect(() => {
    if (failed) return;

    const noMods = (e: KeyboardEvent) => !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
    const onlyAlt = (e: KeyboardEvent) => e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;
    const onlyCtrl = (e: KeyboardEvent) => e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey
    const isSpace = (e: KeyboardEvent) => e.code === "Space" || e.key === " ";
    const inField = (t: EventTarget | null) =>
      t instanceof HTMLElement && !!t.closest("input, textarea, select, [contenteditable='true']");

    const actionOf = (e: KeyboardEvent, field: boolean): (() => void) | null => {
      // Dùng e.code vì trên Mac, Option+K / Option+J gõ ra ký tự đặc biệt ("˚", "∆")
      if (e.key === "Escape" && noMods(e)) return toggle;
      if (onlyAlt(e) && e.code === "KeyK") return toggle;
      if (onlyCtrl(e) && isSpace(e)) return toggle;
      if (onlyAlt(e) && e.code === "KeyJ") return rewind;

      if (field || !noMods(e)) return null;
      if (isSpace(e)) return toggle;
      if (e.code === "KeyJ") return rewind;
      return null;
    };

    // Các tổ hợp dùng được cả trong ô nhập
    // const isGlobalToggle = (e: KeyboardEvent) =>
    //   (e.key === "Escape" && noMods(e)) ||
    //   // Dùng e.code để Option+K trên Mac (vốn gõ ra "˚") vẫn nhận đúng
    //   (e.code === "KeyK" && e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) ||
    //   (isSpace(e) && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey);

    const onKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua khi bộ gõ đang ghép chữ (keyCode 229 = IME đang xử lý)
      if (e.isComposing || e.keyCode === 229) return;

      const action = actionOf(e, inField(e.target));
      if (!action) return;

      e.preventDefault();   // không gõ ký tự, không cuộn trang, không bấm nút đang focus
      e.stopPropagation();  // không để handler khác (ô nhập, view chính) xử lý tiếp
      if (e.repeat) return; // giữ phím không bật/tắt liên tục
      action();
    };

    // Firefox tự "click" nút đang focus khi nhả Space, nên chặn ở keyup
    const onKeyUp = (e: KeyboardEvent) => {
      if (!isSpace(e) || inField(e.target)) return;
      if (e.target instanceof HTMLElement && e.target.closest("button")) e.preventDefault();
    };

    // capture: true để bắt phím TRƯỚC khi ô nhập hoặc handler khác xử lý
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  });

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
        onEnded={(e) => {
          setPlaying(false);
          setCurrent(e.currentTarget.duration || 0);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = rate;
          syncDuration(e.currentTarget);
        }}
        onDurationChange={(e) => syncDuration(e.currentTarget)}
        onError={() => setFailed(true)}
      />

      <Button
        {...keepInputFocus}
        size="icon"
        className="size-12 shrink-0 rounded-full"
        onClick={toggle}
        disabled={failed}
        aria-label={playing ? "Tạm dừng" : "Phát"}
        title={playing ? "Dừng (Space)" : "Phát (Space)"}
        aria-keyshortcuts="Space Control+Space"
      >
        {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
      </Button>

      <div className="min-w-0 flex-1 space-y-2">
        {failed ? (
          <p className="text-sm text-destructive">Không tải được audio, kiểm tra lại link</p>
        ) : (
          <div className="flex items-center gap-2">
            <SeekBar current={current} duration={duration} onSeek={seek} />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatTime(current)} / {formatTime(duration)}
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1">
          <Button {...keepInputFocus}  variant="ghost" size="sm" onClick={() => play(true)} disabled={failed}>
            <RotateCcw className="size-4" />
            Nghe lại
          </Button>
          <Button
            {...keepInputFocus}
            variant="ghost"
            size="sm"
            onClick={rewind}
            disabled={failed}
            title={`Lùi ${REWIND_STEP} giây (J · Alt+J)`}
            aria-keyshortcuts="J Alt+J"
          >
            <Rewind className="size-4" />
            {REWIND_STEP}s
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

// ======================= Thanh tua =======================

const SEEK_STEP = 2; // giây, cho phím ←/→

function SeekBar({
  current, duration, onSeek,
}: {
  current: number;
  duration: number;
  onSeek: (t: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [drag, setDrag] = useState<number | null>(null); // thời điểm đang kéo tới (giây)
  const [hover, setHover] = useState<number | null>(null); // thời điểm chuột đang rê (giây)

  const ready = duration > 0;
  const shown = drag ?? current;
  const pctOf = (t: number) => (ready ? Math.min(100, Math.max(0, (t / duration) * 100)) : 0);
  const tip = drag ?? hover;

  const timeAt = (clientX: number) => {
    const el = trackRef.current;
    if (!el || !ready) return 0;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return ratio * duration;
  };

  const endDrag = () => {
    draggingRef.current = false;
    setDrag(null);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={ready ? 0 : -1}
      aria-label="Tua audio"
      aria-disabled={!ready}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(shown)}
      aria-valuetext={`${formatTime(shown)} / ${formatTime(duration)}`}
      {...keepInputFocus} // bấm vào thanh tua không lấy focus khỏi ô đang gõ
      onPointerDown={(e) => {
        if (!ready || e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        draggingRef.current = true;
        setDrag(timeAt(e.clientX));
      }}
      onPointerMove={(e) => {
        const t = timeAt(e.clientX);
        if (draggingRef.current) setDrag(t);
        if (e.pointerType === "mouse") setHover(t);
      }}
      onPointerUp={(e) => {
        if (!draggingRef.current) return;
        onSeek(timeAt(e.clientX)); // chỉ tua 1 lần khi thả tay, tránh tải lại audio liên tục
        endDrag();
      }}
      onPointerCancel={endDrag}
      onPointerLeave={() => setHover(null)}
      onKeyDown={(e) => {
        if (!ready) return;
        const map: Record<string, number> = {
          ArrowLeft: current - SEEK_STEP,
          ArrowDown: current - SEEK_STEP,
          ArrowRight: current + SEEK_STEP,
          ArrowUp: current + SEEK_STEP,
          Home: 0,
          End: duration,
        };
        if (!(e.key in map)) return;
        e.preventDefault();
        onSeek(Math.min(duration, Math.max(0, map[e.key])));
      }}
      className={cn(
        "group/seek relative flex h-6 min-w-0 flex-1 touch-none select-none items-center rounded-full outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/30",
        ready ? "cursor-pointer" : "cursor-default opacity-60"
      )}
    >
      {/* Rãnh */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted transition-[height] group-hover/seek:h-2">
        {/* Vị trí chuột đang rê */}
        {hover !== null && drag === null && (
          <div className="absolute inset-y-0 left-0 bg-primary/20" style={{ width: `${pctOf(hover)}%` }} />
        )}
        <div
          className={cn("absolute inset-y-0 left-0 bg-primary", drag === null && "transition-[width] duration-200")}
          style={{ width: `${pctOf(shown)}%` }}
        />
      </div>

      {/* Nút kéo */}
      {ready && (
        <div
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow transition-[width,height]",
            drag !== null ? "size-4" : "size-3 group-hover/seek:size-3.5",
            drag === null && "transition-[left,width,height] duration-200"
          )}
          style={{ left: `${pctOf(shown)}%` }}
        />
      )}

      {/* Tooltip thời gian */}
      {ready && tip !== null && (
        <div
          className="pointer-events-none absolute bottom-full mb-1 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-background"
          style={{ left: `${pctOf(tip)}%` }}
        >
          {formatTime(tip)}
        </div>
      )}
    </div>
  );
}