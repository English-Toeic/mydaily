// components/PracticeSummary.tsx
import { ChevronRight, RotateCcw, Trophy, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Word } from "@/types/vocab";
import type { Result } from "../lib/session";
import { TONES } from "../ui";
import { AnswerDiff } from "./AnswerDiff";

interface Props {
  word: Word;
  results: Result[];
  speak: (text: string) => void;
  onRestart: () => void;
  onDone: () => void;
}

export function PracticeSummary({ word, results, speak, onRestart, onDone }: Props) {
  const score = results.filter((r) => r.verdict !== "wrong").length;
  const perfect = results.every((r) => r.verdict === "correct" && !r.hinted && !r.overridden);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-4 sm:py-8">
      <section className="rounded-3xl border bg-linear-to-b from-primary/[0.07] via-card to-card px-6 py-8 text-center shadow-sm">
        <Trophy className={cn("mx-auto size-12", perfect ? "text-amber-500" : "text-primary")} />
        <h2 className="mt-3 text-2xl font-bold">{perfect ? "Xuất sắc!" : "Hoàn thành!"}</h2>
        <p className="mt-1 text-muted-foreground">
          Bạn dịch đúng{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {score}/{results.length}
          </span>{" "}
          câu với từ <span lang="en" className="font-semibold text-foreground">{word.english}</span>
        </p>
      </section>

      <ul className="space-y-2">
        {results.map((r, i) => (
          <SummaryItem key={i} result={r} onSpeak={() => speak(r.best)} />
        ))}
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

function Badge({ children }: { children: string }) {
  return (
    <span className="ml-1.5 rounded bg-amber-500/15 px-1 text-[11px] text-amber-700 dark:text-amber-300">
      {children}
    </span>
  );
}

function SummaryItem({ result: r, onSpeak }: { result: Result; onSpeak: () => void }) {
  const tone = TONES[r.verdict];
  const Icon = tone.Icon;
  const showInput = r.verdict !== "correct" && !!r.input;

  return (
    <li className={cn("rounded-2xl border p-3", tone.box)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-white",
            tone.dot
          )}
        >
          <Icon className="size-3" strokeWidth={3} />
        </span>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p lang="vi" className="text-sm text-muted-foreground">
            {r.vi}
            {r.hinted && <Badge>gợi ý</Badge>}
            {r.overridden && <Badge>tự chấm</Badge>}
          </p>
          <AnswerDiff answer={r.best} diff={r.diff} highlight={showInput} compact />
          {showInput && (
            <p lang="en" className="text-sm text-muted-foreground">
              Bạn viết: <span className={tone.text}>{r.input}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onSpeak}
          aria-label={`Nghe: ${r.best}`}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
        >
          <Volume2 className="size-4" />
        </button>
      </div>
    </li>
  );
}