import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { FileAudio, Loader2, Languages } from "lucide-react";
import type { Section } from "@/types";
import {
  transcribeAudio,
  translateMany,
  isNoiseBlock,
  safeName,
} from "@/lib/transcribe";
import { createLessonFromResult } from "@/lib/createLesson";

export type Row = {
  english: string;
  vietnamese: string;
  start_ms: number;
  end_ms: number;
  speaker: string | null;
  include: boolean;
};

type Step = "idle" | "working" | "review" | "saving";

const BUCKET = "lesson-audio";

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function AudioTranscribeForm({
  sections,
  onChanged,
}: {
  sections: Section[];
  onChanged: () => void;
}) {
  const [sectionId, setSectionId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [startOrder, setStartOrder] = useState("1");
  const [skipNoise, setSkipNoise] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [saveAudio, setSaveAudio] = useState(false);

  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const selectedCount = rows.filter((r) => r.include && r.english.trim()).length;
  const busy = step === "working" || step === "saving";

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  /* ---------- Xử lý: upload → transcribe → dịch ---------- */
  async function process() {
    if (!file) return alert("Chọn file audio trước");
    setError(null);
    setResultMsg(null);
    setRows([]);
    setStep("working");

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const blocks = await transcribeAudio(file, {
        signal: ac.signal,
        onProgress: setProgress,
      });
      if (blocks.length === 0) throw new Error("Không nhận được câu nào từ audio");

      const initial: Row[] = blocks
        .filter((b) => b.text?.trim())
        .map((b) => ({
          english: b.text.trim(),
          vietnamese: "",
          start_ms: b.StartTime,
          end_ms: b.EndTime,
          speaker: b.Speaker ?? null,
          include: !(skipNoise && isNoiseBlock(b.text)),
        }));

      if (autoTranslate) {
        await translateRows(initial, ac.signal);
      }

      setRows(initial);
      setStep("review");
      setProgress("");
    } catch (e) {
      const err = e as Error;
      if (err.name !== "AbortError") setError(err.message);
      setStep("idle");
      setProgress("");
    }
  }

  /** Dịch các dòng được tick mà chưa có nghĩa (mutate mảng truyền vào) */
  async function translateRows(target: Row[], signal?: AbortSignal) {
    const idx = target
      .map((r, i) => (r.include && !r.vietnamese.trim() ? i : -1))
      .filter((i) => i >= 0);
    if (idx.length === 0) return;

    const translated = await translateMany(
      idx.map((i) => target[i].english),
      {
        signal,
        onProgress: (d, t) => setProgress(`Đang dịch ${d}/${t} câu...`),
      }
    );
    idx.forEach((rowIdx, k) => {
      target[rowIdx].vietnamese = translated[k];
    });

    const failed = translated.filter((t) => !t).length;
    if (failed > 0) {
      setError(`${failed} câu dịch thất bại (có thể đã hết token). Bạn có thể sửa tay hoặc bấm "Dịch câu trống".`);
    }
  }

  async function retranslateEmpty() {
    setError(null);
    setStep("working");
    const copy = rows.map((r) => ({ ...r }));
    await translateRows(copy);
    setRows(copy);
    setStep("review");
    setProgress("");
  }

  function cancel() {
    abortRef.current?.abort();
  }

  /* ---------- Lưu DB ---------- */
  async function save() {
    // if (!lessonId) return alert("Chọn lesson trước");
    const lesson = await createLessonFromResult({
      sectionId: sectionId,
      segments: rows,
    });
    // setLessonId(String(lesson.id));

    
    const selected = rows.filter((r) => r.include && r.english.trim());
    if (selected.length === 0) return alert("Chưa chọn câu nào");

    setStep("saving");
    setError(null);
    const warnings: string[] = [];

    // 1. Lưu audio vào storage của mình
    if (saveAudio && file) {
      const path = `lessons/${lesson.id}/${Date.now()}_${safeName(file.name)}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || "audio/mpeg" });

      if (upErr) {
        warnings.push(`Không lưu được audio: ${upErr.message}`);
      } else {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: updErr } = await supabase
          .from("lessons")
          .update({ audio_url: data.publicUrl })
          .eq("id", Number(lesson.id));
        if (updErr) warnings.push(`Không cập nhật audio_url: ${updErr.message}`);
      }
    }

    // 2. Insert sentences theo batch
    const start = Number(startOrder) || 1;
    const payload = selected.map((r, i) => ({
      lesson_id: Number(lesson.id),
      english: r.english.trim(),
      vietnamese: r.vietnamese.trim() || null,
      sort_order: start + i,
      start_ms: r.start_ms,
      end_ms: r.end_ms,
      speaker: r.speaker,
    }));

    const BATCH = 500;
    let inserted = 0;
    for (let i = 0; i < payload.length; i += BATCH) {
      const { error } = await supabase.from("sentences").insert(payload.slice(i, i + BATCH));
      if (error) {
        setError(`Lỗi sau khi thêm ${inserted} câu: ${error.message}`);
        setStep("review");
        return;
      }
      inserted += Math.min(BATCH, payload.length - i);
    }

    setResultMsg(
      `✅ Đã thêm ${inserted} câu.` + (warnings.length ? ` ⚠️ ${warnings.join("; ")}` : "")
    );
    setRows([]);
    setFile(null);
    setStartOrder(String(start + inserted));
    setStep("idle");
    onChanged();
  }

  /* ---------- UI ---------- */
  return (
    <div className="border rounded-lg p-4 space-y-3 border-blue-300 bg-blue-50/40">
      <h2 className="font-semibold flex items-center gap-1 text-blue-700">
        <FileAudio className="w-4 h-4" /> Thêm Sentence từ Audio
      </h2>

      <label className="block text-sm">
        <span className="text-muted-foreground">Section</span>
        <select
          className="mt-1 w-full border rounded-md px-3 py-2"
          value={sectionId}
          disabled={busy}
          onChange={(e) => {
            setSectionId(e.target.value);
            setLessonId("");
          }}
        >
          <option value="">-- Chọn Section --</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </label>

      {/* <label className="block text-sm">
        <span className="text-muted-foreground">Lesson</span>
        <select
          className="mt-1 w-full border rounded-md px-3 py-2 disabled:opacity-50"
          value={lessonId}
          disabled={!sectionId || busy}
          onChange={(e) => onSelectLesson(e.target.value)}
        >
          <option value="">-- Chọn Lesson --</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} ({l.sentences?.length ?? 0} câu)
            </option>
          ))}
        </select>
      </label> */}

      <label className="block text-sm">
        <span className="text-muted-foreground">File audio (mp3, wav, m4a...)</span>
        <input
          type="file"
          accept="audio/*"
          disabled={busy}
          className="mt-1 w-full text-sm"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setRows([]);
            setResultMsg(null);
            setError(null);
            setStep("idle");
          }}
        />
        {file && (
          <span className="text-xs text-muted-foreground">
            {file.name} – {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        )}
      </label>

      <label className="block text-sm">
        <span className="text-muted-foreground">Sort order bắt đầu từ</span>
        <input
          type="number"
          className="mt-1 w-full border rounded-md px-3 py-2"
          value={startOrder}
          onChange={(e) => setStartOrder(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={skipNoise} onChange={(e) => setSkipNoise(e.target.checked)} />
          Bỏ câu số thứ tự ("71.", "Questions...")
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={autoTranslate} onChange={(e) => setAutoTranslate(e.target.checked)} />
          Tự động dịch
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={saveAudio} onChange={(e) => setSaveAudio(e.target.checked)} />
          Lưu file audio vào lesson
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={process} disabled={!file || busy}>
          {step === "working" ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Đang xử lý...</>
          ) : (
            "Chuyển audio thành text"
          )}
        </Button>
        {step === "working" && (
          <Button type="button" variant="outline" onClick={cancel}>Hủy</Button>
        )}
      </div>

      {progress && <p className="text-sm text-blue-700">{progress}</p>}
      {error && <p className="text-sm text-destructive">❌ {error}</p>}
      {resultMsg && <p className="text-sm text-green-600 font-medium">{resultMsg}</p>}

      {/* Review */}
      {rows.length > 0 && (
        <div className="rounded-md border bg-background p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Review: {selectedCount}/{rows.length} câu được chọn
            </p>
            <Button type="button" size="sm" variant="outline" onClick={retranslateEmpty} disabled={busy}>
              <Languages className="w-4 h-4 mr-1" /> Dịch câu trống
            </Button>
          </div>

          <div className="max-h-122 overflow-y-auto space-y-2">
            {rows.map((r, i) => (
              <div
                key={i}
                className={`flex gap-2 items-start border-b border-dashed pb-2 ${r.include ? "" : "opacity-40"}`}
              >
                <input
                  type="checkbox"
                  className="mt-2"
                  checked={r.include}
                  onChange={(e) => updateRow(i, { include: e.target.checked })}
                />
                <div className="w-16 shrink-0 text-[11px] text-muted-foreground pt-1">
                  {formatMs(r.start_ms)}
                  <br />
                  {r.speaker}
                </div>
                <div className="flex-1 space-y-1">
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={r.english}
                    onChange={(e) => updateRow(i, { english: e.target.value })}
                    spellCheck={false}
                  />
                  <input
                    className="w-full border rounded px-2 py-1 text-sm text-muted-foreground"
                    value={r.vietnamese}
                    placeholder="Nghĩa tiếng Việt"
                    onChange={(e) => updateRow(i, { vietnamese: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button type="button" onClick={save} disabled={busy || selectedCount === 0}>
            {step === "saving" ? "Đang lưu..." : `Lưu ${selectedCount} câu vào DB`}
          </Button>
        </div>
      )}
    </div>
  );
}