import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check, ChevronRight, CircleCheck, CircleX, Eye, Headphones,
  Lightbulb, RotateCcw, ThumbsUp, TriangleAlert, Users, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Passage, PassageLine } from "@/types/passage";
import type { TextSegment } from "@/lib/passage-highlight";
import type { VoiceSlot } from "@/lib/passage-voices";
import { gradeLine, type LineGrade, type LineVerdict } from "@/lib/passage-grade";
import { speakersOf } from "@/lib/passage-parse";
import { useSpeechQueue, type SpeakFn } from "@/hooks/useSpeechQueue";
import { HighlightedText } from "./HighlightedText";
import { DiffView } from "./DiffView";
import { speakerColor } from "./speaker-colors";

type Phase = "answer" | "retry" | "checked";

interface LineResult {
  input: string;
  grade: LineGrade;
  score: number; // 0 | 0.5 | 1
  overridden?: boolean;
}

const HINT_STEP = 2; // mỗi lần gợi ý mở thêm 2 từ
const scoreOf = (v: LineVerdict) => (v === "correct" ? 1 : v === "almost" ? 0.5 : 0);

const VERDICT_UI: Record<LineVerdict, { label: string; box: string; icon: typeof CircleCheck; color: string }> = {
  correct: { label: "Chính xác", box: "border-emerald-500/40 bg-emerald-500/5", icon: CircleCheck, color: "text-emerald-600" },
  almost: { label: "Gần đúng", box: "border-amber-500/40 bg-amber-500/5", icon: TriangleAlert, color: "text-amber-600" },
  wrong: { label: "Chưa đúng", box: "border-red-500/40 bg-red-500/5", icon: CircleX, color: "text-red-600" },
};

interface Props {
  passage: Passage;
  /** Nhân vật người học đóng. null = viết mọi câu (bài nói) */
  role: string | null;
  highlight: (text: string) => TextSegment[];
  voiceOf: (speaker: string | null) => VoiceSlot;
  speak: SpeakFn;
  stop: () => void;
  supported: boolean;
  onFinish: (score: number) => void;
  onRestart: () => void;
  onChangeRole?: () => void;
  onRead: () => void;
  onActivity?: () => void;
}

export function PassageWriting({
  passage, role, highlight, voiceOf, speak, stop, supported,
  onFinish, onRestart, onChangeRole, onRead, onActivity,
}: Props) {
  const lines = passage.lines;
  const speakers = useMemo(() => speakersOf(lines), [lines]);
  const isMine = useCallback(
    (i: number) => role === null || lines[i]?.speaker === role,
    [role, lines]
  );
  const myIndexes = useMemo(() => lines.map((_, i) => i).filter(isMine), [lines, isMine]);

  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<number, LineResult>>({});
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("answer");
  const [retryGrade, setRetryGrade] = useState<LineGrade | null>(null);
  const [hint, setHint] = useState(0);

  const { play, cancel, playingIndex } = useSpeechQueue(speak, stop);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  const done = index >= lines.length;
  const current: PassageLine | null = done ? null : lines[index];
  const mine = !done && isMine(index);
  const result = results[index];

  const advance = useCallback(() => {
    setInput("");
    setPhase("answer");
    setRetryGrade(null);
    setHint(0);
    setIndex((i) => i + 1);
  }, []);

  const skipOther = useCallback(() => {
    cancel();
    advance();
  }, [cancel, advance]);

  // Lượt của nhân vật khác: đọc to rồi tự chuyển sang lượt tiếp theo
  useEffect(() => {
    if (done || mine || !supported) return;
    const line = lines[index];
    play([{ text: line.en[0], ...voiceOf(line.speaker) }], { onDone: advance });
    return () => cancel();
  }, [index, done, mine, supported, lines, voiceOf, play, cancel, advance]);

  // Lượt người khác: Enter để bỏ qua (hoặc để đi tiếp khi không có TTS)
  useEffect(() => {
    if (done || mine) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      skipOther();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, mine, skipOther]);

  useEffect(() => {
    if (mine) inputRef.current?.focus();
  }, [index, mine]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [index, phase]);

  // ---- Điểm ----
  const total = myIndexes.length;
  const sum = myIndexes.reduce((s, i) => s + (results[i]?.score ?? 0), 0);
  const percent = total ? Math.round((sum / total) * 100) : 0;

  useEffect(() => {
    if (!done || finishedRef.current || total === 0) return;
    finishedRef.current = true;
    onFinish(percent);
  }, [done, percent, total, onFinish]);

  // ---- Hành động ----
  const finalize = (grade: LineGrade, text: string, usedHint: boolean) => {
    if (!current) return;
    const base = scoreOf(grade.verdict);
    setResults((r) => ({
      ...r,
      [index]: { input: text, grade, score: usedHint ? Math.min(base, 0.5) : base },
    }));
    setPhase("checked");
    if (supported) speak(grade.best || current.en[0], voiceOf(current.speaker));
  };

  const check = () => {
    if (!current || !input.trim()) return;
    onActivity?.();
    const g = gradeLine(input, current.en);
    // Sai lần đầu: được thử lại 1 lần, chưa hiện đáp án
    if (g.verdict === "wrong" && phase === "answer") {
      setPhase("retry");
      setRetryGrade(g);
      return;
    }
    finalize(g, input, hint > 0);
  };

  const giveUp = () => {
    if (!current) return;
    onActivity?.();
    const g = gradeLine(input, current.en);
    finalize({ ...g, verdict: "wrong", note: "Đã xem đáp án" }, input, true);
  };

  const override = () =>
    setResults((r) => {
      const cur = r[index];
      if (!cur) return r;
      return {
        ...r,
        [index]: { ...cur, score: 1, overridden: true, grade: { ...cur.grade, verdict: "correct" } },
      };
    });

  const hintWords = current?.en[0].split(/\s+/).filter(Boolean) ?? [];
  const hintText =
    hint > 0 ? hintWords.slice(0, hint).join(" ") + (hint < hintWords.length ? " …" : "") : "";

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (phase === "checked") advance();
    else check();
  };

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Không có câu nào để luyện.</p>;
  }

  if (done) {
    return (
      <WritingSummary
        lines={lines}
        myIndexes={myIndexes}
        results={results}
        percent={percent}
        best={passage.best_score}
        onRestart={onRestart}
        onChangeRole={onChangeRole}
        onRead={onRead}
      />
    );
  }

  const answered = myIndexes.filter((i) => results[i]).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{role ? `Bạn đóng vai ${role}` : "Viết lần lượt từng câu"}</span>
        <span>{answered}/{total} câu</span>
      </div>

      {/* Phần đã qua */}
      <ol className="space-y-3">
        {lines.slice(0, index + 1).map((line, i) => {
          if (i === index && mine) return null; // dòng hiện tại của mình nằm ở AnswerCard
          if (isMine(i)) {
            const r = results[i];
            return r ? <MyLine key={i} line={line} result={r} highlight={highlight} /> : null;
          }
          const active = i === index && playingIndex !== null;
          return (
            <li key={i} className="flex">
              <div className={cn("max-w-[85%] rounded-xl border bg-muted/40 px-4 py-2.5", active && "border-primary")}>
                <div className="mb-0.5 flex items-center gap-2">
                  {line.speaker && (
                    <span className={cn("text-xs font-semibold", speakerColor(speakers, line.speaker))}>
                      {line.speaker}
                    </span>
                  )}
                  {supported && (
                    <button
                      type="button"
                      aria-label="Nghe lại"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => speak(line.en[0], voiceOf(line.speaker))}
                    >
                      <Volume2 className={cn("size-3.5", active && "animate-pulse text-primary")} />
                    </button>
                  )}
                </div>
                <p className="leading-relaxed">
                  <HighlightedText segments={highlight(line.en[0])} />
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{line.vi}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {!mine && (
        <div className="flex justify-end">
          <Button size="sm" variant={supported ? "ghost" : "default"} onClick={skipOther}>
            {supported ? "Bỏ qua" : "Tiếp"}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Lượt của mình */}
      {mine && current && (
        <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
          {role && (
            <p className={cn("text-xs font-semibold", speakerColor(speakers, role))}>Bạn ({role})</p>
          )}
          <p className="text-base font-medium">{current.vi}</p>
          {hintText && <p className="font-mono text-sm text-amber-600">{hintText}</p>}

          <textarea
            ref={inputRef}
            value={input}
            readOnly={phase === "checked"}
            onChange={(e) => {
              setInput(e.target.value);
              onActivity?.();
            }}
            onKeyDown={onKeyDown}
            rows={2}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Viết câu tiếng Anh…"
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring read-only:opacity-80"
          />

          {phase === "retry" && retryGrade && (
            <p className="text-sm text-amber-600">
              Chưa đúng, còn 1 lần thử.{" "}
              {retryGrade.diff.filter((t) => t.kind !== "same").length} chỗ khác đáp án.
            </p>
          )}

          {phase === "checked" && result && (
            <ResultBox
              result={result}
              onReplay={() => speak(result.grade.best, voiceOf(current.speaker))}
              onOverride={override}
              canReplay={supported}
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            {phase !== "checked" ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={hint >= hintWords.length}
                  onClick={() => setHint((h) => h + HINT_STEP)}
                >
                  <Lightbulb className="size-4" />
                  Gợi ý
                </Button>
                <Button size="sm" variant="ghost" onClick={giveUp}>
                  <Eye className="size-4" />
                  Xem đáp án
                </Button>
                <Button size="sm" className="ml-auto" disabled={!input.trim()} onClick={check}>
                  <Check className="size-4" />
                  Kiểm tra
                </Button>
              </>
            ) : (
              <Button size="sm" className="ml-auto" onClick={advance}>
                {index + 1 >= lines.length ? "Xem kết quả" : "Tiếp"}
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Enter: kiểm tra / tiếp · Shift+Enter: xuống dòng · Dùng gợi ý thì tối đa nửa điểm
          </p>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function MyLine({
  line, result, highlight,
}: { line: PassageLine; result: LineResult; highlight: (t: string) => TextSegment[] }) {
  const ui = VERDICT_UI[result.grade.verdict];
  const Icon = ui.icon;
  return (
    <li className="flex justify-end">
      <div className={cn("max-w-[85%] rounded-xl border px-4 py-2.5", ui.box)}>
        <div className="mb-0.5 flex items-center justify-end gap-1 text-xs">
          <Icon className={cn("size-3.5", ui.color)} />
          <span className={ui.color}>{ui.label}</span>
        </div>
        <p className="leading-relaxed">
          <HighlightedText segments={highlight(result.grade.best || line.en[0])} />
        </p>
        {result.grade.verdict !== "correct" && result.input.trim() && (
          <p className="mt-0.5 text-xs text-muted-foreground">Bạn viết: {result.input}</p>
        )}
      </div>
    </li>
  );
}

function ResultBox({
  result, onReplay, onOverride, canReplay,
}: { result: LineResult; onReplay: () => void; onOverride: () => void; canReplay: boolean }) {
  const { grade, overridden } = result;
  const ui = VERDICT_UI[grade.verdict];
  const Icon = ui.icon;
  return (
    <div className={cn("space-y-2 rounded-lg border p-3", ui.box)}>
      <div className="flex flex-wrap items-center gap-x-2 text-sm">
        <Icon className={cn("size-4", ui.color)} />
        <span className={cn("font-semibold", ui.color)}>
          {ui.label}
          {overridden && " (tự tính đúng)"}
        </span>
        {grade.note && <span className="text-muted-foreground">· {grade.note}</span>}
      </div>

      {grade.verdict !== "correct" && <DiffView tokens={grade.diff} />}

      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm">
          <span className="text-muted-foreground">Đáp án: </span>
          {grade.best}
        </p>
        {canReplay && (
          <button type="button" aria-label="Nghe đáp án" onClick={onReplay} className="text-muted-foreground hover:text-foreground">
            <Volume2 className="size-4" />
          </button>
        )}
      </div>

      {grade.verdict !== "correct" && (
        <Button size="sm" variant="ghost" onClick={onOverride}>
          <ThumbsUp className="size-4" />
          Tính là đúng
        </Button>
      )}
    </div>
  );
}

function WritingSummary({
  lines, myIndexes, results, percent, best, onRestart, onChangeRole, onRead,
}: {
  lines: PassageLine[];
  myIndexes: number[];
  results: Record<number, LineResult>;
  percent: number;
  best: number | null;
  onRestart: () => void;
  onChangeRole?: () => void;
  onRead: () => void;
}) {
  const count = (v: LineVerdict) => myIndexes.filter((i) => results[i]?.grade.verdict === v).length;
  const mistakes = myIndexes.filter((i) => results[i] && results[i].grade.verdict !== "correct");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Kết quả</p>
        <p className="text-4xl font-bold tabular-nums">{percent}%</p>
        <p className="mt-2 text-sm">
          <span className="text-emerald-600">{count("correct")} đúng</span> ·{" "}
          <span className="text-amber-600">{count("almost")} gần đúng</span> ·{" "}
          <span className="text-red-600">{count("wrong")} sai</span>
        </p>
        {best !== null && (
          <p className="mt-1 text-xs text-muted-foreground">Điểm cao nhất: {Math.max(best, percent)}%</p>
        )}
      </div>

      {mistakes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Câu cần xem lại</h3>
          {mistakes.map((i) => (
            <div key={i} className="space-y-1.5 rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">{lines[i].vi}</p>
              <DiffView tokens={results[i].grade.diff} />
              <p className="text-sm"><span className="text-muted-foreground">Đáp án: </span>{results[i].grade.best}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onRestart}>
          <RotateCcw className="size-4" />
          Luyện lại
        </Button>
        {onChangeRole && (
          <Button variant="outline" onClick={onChangeRole}>
            <Users className="size-4" />
            Đổi vai
          </Button>
        )}
        <Button variant="ghost" onClick={onRead}>
          <Headphones className="size-4" />
          Đọc & nghe
        </Button>
      </div>
    </div>
  );
}