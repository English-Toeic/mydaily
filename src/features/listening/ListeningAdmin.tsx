import { useMemo, useState, type FormEvent } from "react";
import { Check, ImageIcon, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { hasNumericId } from "@/lib/errors";
import type { ListeningStore } from "@/hooks/useListening";
import {
  CHOICE_KEYS,
  type ChoiceKey,
  type ListeningChoice,
  type ListeningQuestion,
  type ListeningQuestionFields,
} from "@/types/listening";

const inputCls =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

const isHttpUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export function ListeningAdmin({ store }: { store: ListeningStore }) {
  const { sets, questions } = store;
  const { pending, run } = useAsyncAction();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = sets.find((s) => s.id === selectedId) ?? sets[0] ?? null;
  const setQs = useMemo(
    () => (selected ? questions.filter((q) => q.set_id === selected.id) : []),
    [questions, selected]
  );
  const learnedCount = setQs.filter((q) => q.learned_at).length;

  const [editing, setEditing] = useState<ListeningQuestion | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [newTitle, setNewTitle] = useState("");

  const resetForm = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  const selectSet = (id: number) => {
    setSelectedId(id);
    resetForm();
  };

  // ---------- Bộ đề ----------

  const handleAddSet = async (e: FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const res = await run("add-set", () => store.addSet(title), "Lỗi thêm bộ đề");
    if (res.ok) {
      setNewTitle("");
      if (hasNumericId(res.value)) selectSet(res.value.id);
    }
  };

  const handleRenameSet = async () => {
    if (!selected) return;
    const title = prompt("Tên bộ đề", selected.title)?.trim();
    if (!title || title === selected.title) return;
    await run("rename-set", () => store.updateSet(selected.id, title), "Lỗi đổi tên");
  };

  const handleDeleteSet = async () => {
    if (!selected) return;
    if (!confirm(`Xóa bộ đề "${selected.title}" và ${setQs.length} câu bên trong?`)) return;
    const id = selected.id;
    const res = await run("delete-set", () => store.deleteSet(id), "Lỗi xóa bộ đề");
    if (res.ok) {
      setSelectedId(sets.find((s) => s.id !== id)?.id ?? null);
      resetForm();
    }
  };

  const handleResetProgress = async () => {
    if (!selected || !confirm(`Đưa ${learnedCount} câu về "chưa học"?`)) return;
    await run("reset", () => store.resetProgress(selected.id), "Lỗi đặt lại tiến độ");
  };

  // ---------- Câu hỏi ----------

  const handleSave = async (fields: ListeningQuestionFields) => {
    if (!selected) return;
    const setId = selected.id;
    const target = editing;
    const res = await run(
      "save-q",
      async () => {
        if (target) {
            await store.updateQuestion(target.id, fields);
        } else {
            await store.addQuestion(setId, fields);
        }
        },
      "Lỗi lưu câu hỏi"
    );
    if (res.ok) resetForm();
  };

  const handleEdit = (q: ListeningQuestion) => {
    setEditing(q);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (q: ListeningQuestion, n: number) => {
    if (!confirm(`Xóa câu #${n}?`)) return;
    const res = await run("delete-q", () => store.deleteQuestion(q.id), "Lỗi xóa câu");
    if (res.ok && editing?.id === q.id) resetForm();
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
      {/* ---------- Sidebar bộ đề ---------- */}
      <aside className="space-y-3 rounded-xl border p-3">
        <form onSubmit={(e) => void handleAddSet(e)} className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Tên bộ đề mới"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button type="submit" size="icon" disabled={!newTitle.trim() || pending === "add-set"} aria-label="Thêm">
            <Plus className="size-4" />
          </Button>
        </form>
        {sets.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Chưa có bộ đề</p>
        ) : (
          <ul className="space-y-1">
            {sets.map((s) => {
              const n = questions.filter((q) => q.set_id === s.id).length;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => selectSet(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition",
                      selected?.id === s.id ? "bg-primary/10 font-medium text-primary" : "hover:bg-muted"
                    )}
                  >
                    <span className="flex-1 truncate">{s.title}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{n}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* ---------- Nội dung bộ đề ---------- */}
      <main className="min-w-0 rounded-xl border p-4">
        {!selected ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Tạo một bộ đề để bắt đầu
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 flex-1 truncate font-semibold">
                {selected.title}
                <span className="font-normal text-muted-foreground">
                  {" "}· {setQs.length} câu · đã học {learnedCount}
                </span>
              </h2>
              <Button size="sm" variant="ghost" onClick={() => void handleRenameSet()}>
                <Pencil className="size-4" />
                Đổi tên
              </Button>
            </div>

            <QuestionForm
              key={formKey}
              initial={editing}
              saving={pending === "save-q"}
              onSubmit={(f) => void handleSave(f)}
              onCancel={resetForm}
            />

            {setQs.length === 0 ? (
              <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                Chưa có câu nào
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {setQs.map((q, i) => {
                  const right = q.choices.find((c) => c.key === q.correct);
                  return (
                    <li
                      key={q.id}
                      className={cn("flex items-center gap-3 px-3 py-2", editing?.id === q.id && "bg-primary/5")}
                    >
                      <span className="w-6 text-xs text-muted-foreground tabular-nums">#{i + 1}</span>
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {q.correct}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{right?.en}</span>
                      {q.image_url && <ImageIcon className="size-4 shrink-0 text-muted-foreground" />}
                      {q.learned_at && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          đã học
                        </span>
                      )}
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => handleEdit(q)} aria-label="Sửa">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive hover:text-destructive"
                        disabled={pending === "delete-q"}
                        onClick={() => void handleDelete(q, i + 1)}
                        aria-label="Xóa"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button
                size="sm"
                variant="ghost"
                disabled={learnedCount === 0 || pending === "reset"}
                onClick={() => void handleResetProgress()}
              >
                <RotateCcw className="size-4" />
                Đặt lại tiến độ
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={pending === "delete-set"}
                onClick={() => void handleDeleteSet()}
              >
                <Trash2 className="size-4" />
                Xóa bộ đề này
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ======================= Form câu hỏi =======================

const emptyChoices = (): ListeningChoice[] => CHOICE_KEYS.map((key) => ({ key, en: "", vi: "" }));

function QuestionForm({
  initial, saving, onSubmit, onCancel,
}: {
  initial: ListeningQuestion | null;
  saving: boolean;
  onSubmit: (f: ListeningQuestionFields) => void;
  onCancel: () => void;
}) {
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [audioUrl, setAudioUrl] = useState(initial?.audio_url ?? "");
  const [choices, setChoices] = useState<ListeningChoice[]>(
    () => initial?.choices.map((c) => ({ ...c })) ?? emptyChoices()
  );
  const [correct, setCorrect] = useState<ChoiceKey>(initial?.correct ?? "A");
  const [error, setError] = useState<string | null>(null);

  const updateChoice = (key: ChoiceKey, field: "en" | "vi", value: string) =>
    setChoices((cs) => cs.map((c) => (c.key === key ? { ...c, [field]: value } : c)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const audio = audioUrl.trim();
    const image = imageUrl.trim();
    if (!isHttpUrl(audio)) return setError("Link audio không hợp lệ (cần bắt đầu bằng http/https)");
    if (image && !isHttpUrl(image)) return setError("Link ảnh không hợp lệ");
    const cleaned = choices.map((c) => ({ key: c.key, en: c.en.trim(), vi: c.vi.trim() }));
    const missing = cleaned.find((c) => !c.en);
    if (missing) return setError(`Đáp án ${missing.key} chưa có tiếng Anh`);
    setError(null);
    onSubmit({ audio_url: audio, image_url: image || null, choices: cleaned, correct });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-semibold">{initial ? "Sửa câu hỏi" : "Thêm câu hỏi"}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium">Link audio *</span>
          <input className={inputCls} value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://..." />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium">Link ảnh (không bắt buộc)</span>
          <input className={inputCls} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Đáp án (bấm vào chữ cái để chọn đáp án đúng)</span>
        {choices.map((c) => (
          <div key={c.key} className="flex items-start gap-2">
            <label
              className={cn(
                "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-bold transition",
                correct === c.key
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "bg-background hover:border-primary"
              )}
              title={`Chọn ${c.key} là đáp án đúng`}
            >
              <input
                type="radio"
                name="listening-correct"
                className="sr-only"
                checked={correct === c.key}
                onChange={() => setCorrect(c.key)}
              />
              {correct === c.key ? <Check className="size-4" /> : c.key}
            </label>
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <input
                className={inputCls}
                value={c.en}
                onChange={(e) => updateChoice(c.key, "en", e.target.value)}
                placeholder={`${c.key}. Tiếng Anh`}
              />
              <input
                className={inputCls}
                value={c.vi}
                onChange={(e) => updateChoice(c.key, "vi", e.target.value)}
                placeholder="Tiếng Việt"
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Đang lưu..." : initial ? "Lưu thay đổi" : "Thêm câu"}
        </Button>
        {initial && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
}