import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  AlertTriangle, ArrowLeft, Check, ChevronRight, Flame,
  Lightbulb, Loader2, MessageSquareOff, MessageSquareText, Volume2, VolumeX, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { keepInputFocus } from "@/lib/keepInputFocus";
import { useTTS } from "@/hooks/useTTS";
import type { Deck, Word } from "@/types/vocab";
import { hintWords, type Verdict } from "./answer";
import { useStudySession, type StudyMode } from "./useStudySession";
import { useCtrlTap } from "./useCtrlTap";
import { StudySummary } from "./StudySummary";
import { SentencePractice } from "./SentencePractice";

interface Props {
  deck: Deck;
  onBack: () => void;
  onGrade: (word: Word, correct: boolean) => Promise<Word>;
}

const MODE_OPTIONS: { value: StudyMode; label: string }[] = [
  { value: "vi-en", label: "Việt → Anh" },
  { value: "en-vi", label: "Anh → Việt" },
  { value: "mixed", label: "Trộn" },
];

const PRACTICE_KEY = "vocab:sentence-practice";
const noop = () => {};

export function VocabStudyView({ deck, onBack, onGrade }: Props) {
  const { speak, speaking } = useTTS();
  const s = useStudySession({ deck, onGrade, speak });
  
  const inputRef = useRef<HTMLInputElement>(null);

  // ---- Luyện câu ----
  const [practiceWord, setPracticeWord] = useState<Word | null>(null);
  const [practiced, setPracticed] = useState<Set<Word["id"]>>(() => new Set());
  const [practiceOn, setPracticeOn] = useState(
    () => localStorage.getItem(PRACTICE_KEY) !== "off"
  );

  // Đang luyện câu thì Ctrl do SentencePractice xử lý
  useCtrlTap(practiceWord ? noop : s.replay);

  useEffect(() => {
    if (!practiceWord) inputRef.current?.focus();
  }, [s.cardKey, practiceWord]);

  const togglePractice = () => {
    const v = !practiceOn;
    setPracticeOn(v);
    localStorage.setItem(PRACTICE_KEY, v ? "on" : "off");
  };

  // Sau khi trả lời đúng, từ có câu và chưa luyện trong phiên → sẽ luyện câu
  const willPractice =
    !!s.card &&
    s.phase === "checked" &&
    s.passed &&
    practiceOn &&
    (s.card.word.sentences?.length ?? 0) > 0 &&
    !practiced.has(s.card.word.id);

  const goNext = async () => {
    if (!s.card || s.grading) return;
    const word = s.card.word;
    const shouldPractice = willPractice;
    await s.next(); // chấm điểm và lưu như cũ
    if (shouldPractice) {
      setPracticed((prev) => new Set(prev).add(word.id));
      setPracticeWord(word);
    }
  };

  const restart = () => {
    setPracticed(new Set());
    s.restart();
  };

  if (practiceWord) {
    return (
      <SentencePractice
        key={practiceWord.id}
        word={practiceWord}
        speak={speak}
        speaking={speaking}
        autoSpeak={s.autoSpeak}
        onDone={() => setPracticeWord(null)}
      />
    );
  }
  
  if (!s.card) {
    return (
      <StudySummary deck={deck} session={s.session} onRestart={restart} onBack={onBack} speak={speak} />
    );
  }

  const { card, verdict, session } = s;
  const isViEn = card.dir === "vi-en";
  const checked = s.phase === "checked";
  const { stats } = session;
  const progress = session.total ? Math.round((session.cleared / session.total) * 100) : 0;
  const accuracy = stats.answered ? Math.round((stats.passed / stats.answered) * 100) : null;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Bỏ qua Enter khi bộ gõ Telex/VNI đang ghép chữ
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (checked) void goNext();
    else s.check();
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-4 sm:py-8">
      {/* Header */}
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại" className="shrink-0 rounded-full">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold leading-tight">{deck.name}</h1>
          <p className="text-xs text-muted-foreground">Còn {session.queue.length} từ</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          {...keepInputFocus}
          onClick={s.toggleAutoSpeak}
          aria-pressed={s.autoSpeak}
          aria-label={s.autoSpeak ? "Tắt tự đọc" : "Bật tự đọc"}
          title={s.autoSpeak ? "Tự đọc: bật" : "Tự đọc: tắt"}
          className="shrink-0 rounded-full text-muted-foreground"
        >
          {s.autoSpeak ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          {...keepInputFocus}
          onClick={togglePractice}
          aria-pressed={practiceOn}
          aria-label={practiceOn ? "Tắt luyện câu" : "Bật luyện câu"}
          title={practiceOn ? "Luyện câu: đang bật (bấm để tắt)" : "Luyện câu: đang tắt (bấm để bật)"}
          className={cn(
            "shrink-0 rounded-full transition-colors",
            practiceOn
              ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
              : "text-muted-foreground/60 hover:text-muted-foreground"
          )}
        >
          {practiceOn ? (
            <MessageSquareText className="size-5" />
          ) : (
            <MessageSquareOff className="size-5" />
          )}
        </Button>
      </header>

      <ModeSwitch value={s.mode} onChange={s.setMode} />

      {/* Tiến độ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{session.cleared}</span>
            /{session.total} đã qua
          </span>
          <div className="flex items-center gap-3">
            {stats.streak >= 2 && (
              <span className="inline-flex items-center gap-1 font-semibold text-orange-500">
                <Flame className="size-3.5" /> {stats.streak}
              </span>
            )}
            {accuracy !== null && (
              <span className="tabular-nums text-muted-foreground">{accuracy}% chính xác</span>
            )}
          </div>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Thẻ câu hỏi */}
      <section className="relative rounded-3xl border bg-linear-to-b from-primary/[0.07] via-card to-card px-6 pb-8 pt-10 text-center shadow-sm">
        <StatusPill status={card.word.status} className="absolute left-4 top-4" />
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {isViEn ? "Từ tiếng Anh là gì?" : "Nghĩa tiếng Việt là gì?"}
        </p>
        <p
          lang={isViEn ? "vi" : "en"}
          className="mt-3 wrap-break-word text-3xl font-bold tracking-tight sm:text-4xl"
        >
          {isViEn ? card.word.meaning : card.word.english}
        </p>

        {s.canListen && (
          <button
            type="button"
            {...keepInputFocus}
            onClick={s.replay}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-sm text-muted-foreground ring-1 ring-border transition hover:text-foreground active:scale-95 touch-manipulation"
          >
            <Volume2 className={cn("size-4", speaking && "animate-pulse text-primary")} />
            {card.word.ipa ? <span className="font-mono">{card.word.ipa}</span> : "Nghe"}
          </button>
        )}

        {s.hints > 0 && !checked && <HintMask target={s.hintTarget} revealed={s.hints} />}
      </section>

      {/* Ô nhập */}
      <div className="space-y-3">
        <div className={cn("relative", checked && verdict === "wrong" && "animate-shake motion-reduce:animate-none")}>
          <input
            ref={inputRef}
            value={s.input}
            onChange={(e) => s.setInput(e.target.value)}
            onKeyDown={onKeyDown}
            // readOnly thay vì disabled để giữ focus, bàn phím mobile không thu xuống
            readOnly={checked}
            enterKeyHint={checked ? "next" : "done"}
            lang={isViEn ? "en" : "vi"}
            placeholder={isViEn ? "Gõ từ tiếng Anh…" : "Gõ nghĩa tiếng Việt…"}
            aria-label="Câu trả lời"
            aria-invalid={checked && verdict === "wrong"}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={cn(
              "h-14 w-full rounded-2xl border-2 bg-background px-4 pr-12 text-lg outline-none transition-all placeholder:text-muted-foreground/60",
              !checked && "border-input focus:border-primary focus:ring-4 focus:ring-primary/15",
              checked && verdict === "correct" && "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
              checked && verdict === "almost" && "border-amber-500 bg-amber-500/5 text-amber-700 dark:text-amber-300",
              checked && verdict === "wrong" && "border-red-500 bg-red-500/5 text-red-700 line-through decoration-red-500/40 dark:text-red-300"
            )}
          />
          {checked && verdict && <VerdictIcon verdict={verdict} />}
        </div>

        {checked && verdict && (
          <Feedback
            word={card.word}
            verdict={verdict}
            input={s.input}
            hinted={s.hints > 0}
            overridden={s.overridden}
            passed={s.passed}
            onOverride={s.override}
          />
        )}
      </div>

      {s.error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="size-4 shrink-0" /> {s.error}
        </p>
      )}

      {/* Hành động */}
      <div className="flex gap-2">
        {!checked ? (
          <>
            <Button
              variant="outline"
              {...keepInputFocus}
              onClick={s.hint}
              disabled={s.hints >= s.maxHints}
              className="h-12 rounded-xl px-4 touch-manipulation"
            >
              <Lightbulb className="size-4" />
              <span className="hidden min-[400px]:inline">Gợi ý</span>
            </Button>
            <Button
              variant="ghost"
              {...keepInputFocus}
              onClick={s.giveUp}
              className="h-12 rounded-xl px-3 text-muted-foreground touch-manipulation"
            >
              Không biết
            </Button>
            <Button
              {...keepInputFocus}
              onClick={s.check}
              disabled={!s.input.trim()}
              className="h-12 flex-1 rounded-xl text-base touch-manipulation"
            >
              Kiểm tra
            </Button>
          </>
        ) : (
          <Button
            {...keepInputFocus}
            onClick={() => void goNext()}
            disabled={s.grading}
            className="h-12 flex-1 rounded-xl text-base touch-manipulation"
          >
            {s.grading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {s.passed ? (willPractice ? "Luyện 5 câu" : "Tiếp theo") : "Học lại sau"}
                <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Phím tắt: ẩn trên mobile */}
      <p className="hidden items-center justify-center gap-3 text-xs text-muted-foreground sm:flex">
        <span>
          <Kbd>Enter</Kbd> {checked ? "tiếp tục" : "kiểm tra"}
        </span>
        {s.canListen && (
          <>
            <span className="text-border">|</span>
            <span>
              <Kbd>Ctrl</Kbd> nghe lại
            </span>
          </>
        )}
      </p>
    </div>
  );
}

/* ---------- Các component nhỏ ---------- */

function ModeSwitch({ value, onChange }: { value: StudyMode; onChange: (m: StudyMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Chiều học" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
      {MODE_OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            {...keepInputFocus}
            onClick={() => !active && onChange(o.value)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-sm font-medium transition-all touch-manipulation",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const STATUS_STYLE: Record<Word["status"], { label: string; className: string }> = {
  new: { label: "Mới", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  learning: { label: "Đang học", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  learned: { label: "Đã thuộc", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

function StatusPill({ status, className }: { status: Word["status"]; className?: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.new;
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", s.className, className)}>
      {s.label}
    </span>
  );
}

function HintMask({ target, revealed }: { target: string; revealed: number }) {
  return (
    <div aria-label="Gợi ý" className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 font-mono text-lg">
      {hintWords(target, revealed).map((word, i) => (
        <span key={i} className="flex gap-1">
          {word.map((ch, j) => (
            <span
              key={j}
              className={cn(
                "inline-block w-[1.1ch] text-center",
                ch === null ? "border-b-2 border-muted-foreground/40 text-transparent" : "font-semibold text-primary"
              )}
            >
              {ch ?? "_"}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

const VERDICT_ICON = {
  correct: { Icon: Check, className: "bg-emerald-500" },
  almost: { Icon: AlertTriangle, className: "bg-amber-500" },
  wrong: { Icon: X, className: "bg-red-500" },
} as const;

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  const { Icon, className } = VERDICT_ICON[verdict];
  return (
    <span className={cn("absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-white", className)}>
      <Icon className="size-4" strokeWidth={3} />
    </span>
  );
}

const TONE = {
  emerald: "border-emerald-500/30 bg-emerald-500/[0.06] [--tone:theme(colors.emerald.600)]",
  amber: "border-amber-500/30 bg-amber-500/[0.06] [--tone:theme(colors.amber.600)]",
  red: "border-red-500/30 bg-red-500/[0.06] [--tone:theme(colors.red.600)]",
} as const;

function Feedback({
  word, verdict, input, hinted, overridden, passed, onOverride,
}: {
  word: Word;
  verdict: Verdict;
  input: string;
  hinted: boolean;
  overridden: boolean;
  passed: boolean;
  onOverride: () => void;
}) {
  const tone: keyof typeof TONE =
    verdict === "wrong" ? "red" : verdict === "almost" || hinted ? "amber" : "emerald";

  const title =
    verdict === "wrong" ? (input.trim() ? "Chưa đúng" : "Không sao, ghi nhớ nhé")
    : verdict === "almost" ? "Gần đúng, chú ý chính tả"
    : hinted ? "Đúng, nhưng đã dùng gợi ý"
    : overridden ? "Đã tính là đúng"
    : "Chính xác! 🎉";

  return (
    <div role="status" className={cn("rounded-2xl border p-4", TONE[tone])}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-(--tone)">{title}</p>
        {verdict === "wrong" && input.trim() && (
          <button
            type="button"
            {...keepInputFocus}
            onClick={onOverride}
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border transition hover:bg-background hover:text-foreground touch-manipulation"
          >
            Tôi đúng
          </button>
        )}
      </div>

      {/* Luôn hiện đủ thông tin của từ để củng cố trí nhớ */}
      <div className="mt-3 space-y-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span lang="en" className="text-xl font-bold">{word.english}</span>
          {word.ipa && <span className="font-mono text-sm text-muted-foreground">{word.ipa}</span>}
        </p>
        <p className="text-sm text-muted-foreground">{word.meaning}</p>
      </div>

      {!passed && (
        <p className="mt-3 border-t border-current/10 pt-2 text-xs text-muted-foreground">
          Từ này sẽ quay lại sau vài từ nữa.
        </p>
      )}
    </div>
  );
}