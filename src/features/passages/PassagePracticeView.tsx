import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Headphones, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Word } from "@/types/vocab";
import type { Passage, PassageMode } from "@/types/passage";
import { PASSAGE_KIND_LABEL } from "@/types/passage";
import { useTTS } from "@/hooks/useTTS";
import { speakersOf } from "@/lib/passage-parse";
import { buildCachedMatcher } from "@/lib/passage-highlight";
import { assignVoices, DEFAULT_SLOT, type VoiceSlot } from "@/lib/passage-voices";
import { PassageReader } from "./PassageReader";
import { PassageWriting } from "./PassageWriting";
import { speakerColor } from "./speaker-colors";

interface Props {
  passage: Passage;
  /** Từ của deck, để tô sáng */
  words: Word[];
  mode: PassageMode;
  onModeChange: (mode: PassageMode) => void;
  onRecord: (score: number) => void;
  onBack: () => void;
  onActivity?: () => void;
}

export function PassagePracticeView({
  passage, words, mode, onModeChange, onRecord, onBack, onActivity,
}: Props) {
  const { speak, stop, supported, englishVoices } = useTTS();
  const isDialogue = passage.kind === "dialogue";
  const speakers = useMemo(() => speakersOf(passage.lines), [passage.lines]);
  const hasRoles = isDialogue && speakers.length > 0;

  const voiceMap = useMemo(() => assignVoices(speakers, englishVoices), [speakers, englishVoices]);
  const voiceOf = useCallback(
    (sp: string | null): VoiceSlot => voiceMap.get(sp ?? "") ?? voiceMap.get("") ?? DEFAULT_SLOT,
    [voiceMap]
  );

  // Matcher dựng 1 lần cho mỗi deck, kết quả của từng câu được cache
  const highlight = useMemo(() => buildCachedMatcher(words), [words]);

  const [role, setRole] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);

  const writeLabel = isDialogue ? "Nhập vai" : "Viết";
  const tabs: [PassageMode, string, typeof Headphones][] = [
    ["read", "Đọc & nghe", Headphones],
    ["write", writeLabel, PenLine],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {PASSAGE_KIND_LABEL[passage.kind]}
            {passage.best_score !== null && ` · Cao nhất ${passage.best_score}%`}
          </p>
          <h1 className="truncate text-lg font-semibold">{passage.title}</h1>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
              mode === id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {mode === "read" ? (
        <PassageReader
          passage={passage}
          highlight={highlight}
          voiceOf={voiceOf}
          speak={speak}
          stop={stop}
          supported={supported}
          onActivity={onActivity}
        />
      ) : hasRoles && role === null ? (
        <RolePicker passage={passage} speakers={speakers} onPick={setRole} />
      ) : (
        <PassageWriting
          key={`${runKey}-${role ?? ""}`}
          passage={passage}
          role={hasRoles ? role : null}
          highlight={highlight}
          voiceOf={voiceOf}
          speak={speak}
          stop={stop}
          supported={supported}
          onFinish={onRecord}
          onRestart={() => setRunKey((k) => k + 1)}
          onChangeRole={hasRoles ? () => setRole(null) : undefined}
          onRead={() => onModeChange("read")}
          onActivity={onActivity}
        />
      )}
    </div>
  );
}

function RolePicker({
  passage, speakers, onPick,
}: { passage: Passage; speakers: string[]; onPick: (s: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Chọn nhân vật bạn đóng. Lượt của nhân vật khác sẽ được đọc to.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {speakers.map((s) => {
          const n = passage.lines.filter((l) => l.speaker === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-xl border bg-card px-4 py-3 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <p className={cn("font-semibold", speakerColor(speakers, s))}>{s}</p>
              <p className="text-xs text-muted-foreground">{n} lượt nói</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}