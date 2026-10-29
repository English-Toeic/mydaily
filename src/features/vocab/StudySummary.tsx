import { ArrowLeft, RotateCcw, Target, Trophy, Volume2, Flame, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types/vocab";
import type { RestartKind, Session } from "./useStudySession";

type Props = {
  deck: Deck;
  session: Session;
  onRestart: (kind: RestartKind) => void;
  onBack: () => void;
  speak: (text: string) => void;
};

export function StudySummary({ deck, session, onRestart, onBack, speak }: Props) {
  const { stats } = session;
  const missed = [...session.missed.values()];
  const total = deck.words.length;
  const learned = deck.words.filter((w) => w.status === "learned").length;
  const unlearned = total - learned;
  const accuracy = stats.answered ? Math.round((stats.passed / stats.answered) * 100) : 0;
  const nothingStudied = stats.answered === 0;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
      <div className="flex flex-col items-center text-center">
        <div className="grid size-20 place-items-center rounded-full bg-linear-to-br from-amber-300 to-orange-500 text-white shadow-lg shadow-orange-500/30">
          <Trophy className="size-9" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {nothingStudied ? "Bạn đã thuộc hết deck này!" : "Hoàn thành phiên học!"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          “{deck.name}” · {learned}/{total} từ đã thuộc
        </p>
      </div>

      {!nothingStudied && (
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={ListChecks} label="Lượt trả lời" value={stats.answered} />
          <Stat icon={Target} label="Chính xác" value={`${accuracy}%`} />
          <Stat icon={Flame} label="Chuỗi dài nhất" value={stats.best} />
        </div>
      )}

      {missed.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Từ cần chú ý ({missed.length})</h2>
          <ul className="max-h-64 divide-y overflow-y-auto rounded-2xl border">
            {missed.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => speak(w.english)}
                  aria-label={`Nghe ${w.english}`}
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground active:scale-95"
                >
                  <Volume2 className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {w.english}
                    {w.ipa && <span className="ml-2 font-mono text-xs text-muted-foreground">{w.ipa}</span>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{w.meaning}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2">
        {missed.length > 0 ? (
          <Button autoFocus onClick={() => onRestart("missed")} className="h-12 rounded-xl text-base">
            <RotateCcw className="size-4" /> Ôn lại {missed.length} từ sai
          </Button>
        ) : unlearned > 0 ? (
          <Button autoFocus onClick={() => onRestart("unlearned")} className="h-12 rounded-xl text-base">
            <RotateCcw className="size-4" /> Học {unlearned} từ chưa thuộc
          </Button>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            autoFocus={missed.length === 0 && unlearned === 0}
            onClick={() => onRestart("all")}
            className="h-11 rounded-xl"
          >
            <RotateCcw className="size-4" /> Học lại tất cả
          </Button>
          <Button variant="ghost" onClick={onBack} className="h-11 rounded-xl">
            <ArrowLeft className="size-4" /> Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card px-2 py-4">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-center text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}