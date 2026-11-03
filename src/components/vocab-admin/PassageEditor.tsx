import { useId, useState } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Passage, PassageFields, PassageKind } from "@/types/passage";
import { PASSAGE_KIND_LABEL } from "@/types/passage";
import {
  buildLines,
  newDraft,
  parsePastedText,
  toLineDrafts,
  type LineDraft,
} from "@/lib/passage-parse";
import { inputCls } from "./styles";

const FORMAT_HINT: Record<PassageKind, string> = {
  dialogue: [
    "Sarah: Any update on the blank checkout page?",
    "= Có tin gì về trang thanh toán bị trắng chưa?",
    "+ Is there any update on the blank checkout page?",
    "Tien: Yes, I found the root cause.",
    "= Có, mình tìm ra nguyên nhân gốc rồi.",
  ].join("\n"),
  speech: [
    "Today I want to explain why the checkout page crashed.",
    "= Hôm nay tôi muốn giải thích vì sao trang thanh toán bị lỗi.",
    "The root cause is expired tokens.",
    "= Nguyên nhân gốc là token hết hạn.",
  ].join("\n"),
};

type DraftField = Exclude<keyof LineDraft, "key">;

interface Props {
  kind: PassageKind;
  initial: Passage | null;
  onSave: (fields: PassageFields) => Promise<boolean>;
  onCancel: () => void;
}

export function PassageEditor({ kind, initial, onSave, onCancel }: Props) {
  const listId = useId();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [paste, setPaste] = useState("");
  const [drafts, setDrafts] = useState<LineDraft[]>(() => (initial ? toLineDrafts(initial.lines) : []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDialogue = kind === "dialogue";
  const label = PASSAGE_KIND_LABEL[kind].toLowerCase();
  const speakers = [...new Set(drafts.map((d) => d.speaker.trim()).filter(Boolean))];
  const missingVi = drafts.filter((d) => d.en.trim() && !d.vi.trim()).length;

  const update = (key: string, field: DraftField, value: string) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, [field]: value } : d)));

  const remove = (key: string) => setDrafts((prev) => prev.filter((d) => d.key !== key));

  const move = (index: number, dir: -1 | 1) =>
    setDrafts((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const insertAt = (index: number) =>
    setDrafts((prev) => {
      const next = [...prev];
      // Hội thoại 2 người thường xen kẽ, nên đoán người nói là người của lượt trước đó nữa
      const guess = isDialogue ? prev[index - 2]?.speaker ?? "" : "";
      next.splice(index, 0, newDraft(guess));
      return next;
    });

  const handleSplit = (mode: "replace" | "append") => {
    const parsed = parsePastedText(paste, kind);
    if (!parsed.length) return;
    setDrafts((prev) => (mode === "append" ? [...prev, ...parsed] : parsed));
    setPaste("");
    setError(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề");
      return;
    }
    const res = buildLines(drafts, kind);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError(null);
    setSaving(true);
    const ok = await onSave({ kind, title: title.trim(), lines: res.lines });
    setSaving(false);
    if (!ok) setError("Lưu thất bại, thử lại");
  };

  const hasDrafts = drafts.some((d) => d.en.trim() || d.vi.trim());

  return (
    <div className="space-y-4 rounded-lg border border-primary/40 bg-muted/40 p-3">
      <p className="text-xs font-medium text-primary">
        {initial ? `Đang sửa: ${initial.title}` : `Thêm ${label} mới`}
      </p>

      <input
        value={title}
        disabled={saving}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tiêu đề, vd: Báo cáo nguyên nhân"
        className={inputCls}
      />

      {/* Ô dán */}
      <div className="space-y-2">
        <textarea
          value={paste}
          disabled={saving}
          onChange={(e) => setPaste(e.target.value)}
          rows={5}
          placeholder={FORMAT_HINT[kind]}
          className={cn(inputCls, "h-auto min-h-28 resize-y font-mono text-xs")}
        />
        <p className="text-xs text-muted-foreground">
          {isDialogue
            ? 'Mỗi lượt một dòng "Tên: câu", hoặc dán cả đoạn liền, app tự tách theo "Tên:". '
            : "Dán cả đoạn, app tự tách theo câu. "}
          Dòng <code>= …</code> là tiếng Việt của dòng trên, <code>+ …</code> là cách nói khác.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!paste.trim() || saving}
            onClick={() => {
              if (hasDrafts && !confirm(`Thay ${drafts.length} dòng hiện có bằng nội dung mới?`)) return;
              handleSplit("replace");
            }}
          >
            <Scissors className="mr-1 h-4 w-4" />
            Tách dòng
          </Button>
          {hasDrafts && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!paste.trim() || saving}
              onClick={() => handleSplit("append")}
            >
              Nối thêm vào cuối
            </Button>
          )}
        </div>
      </div>

      {/* Bảng dòng */}
      {drafts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{drafts.length} dòng</span>
            {missingVi > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                Còn {missingVi} dòng chưa có tiếng Việt
              </span>
            )}
          </div>

          {isDialogue && (
            <datalist id={listId}>
              {speakers.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}

          <ol className="space-y-2">
            {drafts.map((d, i) => (
              <li key={d.key} className="rounded-lg border bg-background p-2">
                <div className="mb-2 flex items-center gap-2">
                  <span className="w-6 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                  {isDialogue && (
                    <input
                      list={listId}
                      value={d.speaker}
                      disabled={saving}
                      onChange={(e) => update(d.key, "speaker", e.target.value)}
                      placeholder="Người nói"
                      className={cn(inputCls, "h-8 w-36")}
                    />
                  )}
                  <div className="ml-auto flex items-center">
                    <IconBtn label="Lên" disabled={i === 0 || saving} onClick={() => move(i, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Xuống" disabled={i === drafts.length - 1 || saving} onClick={() => move(i, 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Chèn dòng phía dưới" disabled={saving} onClick={() => insertAt(i + 1)}>
                      <Plus className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label="Xoá dòng" disabled={saving} onClick={() => remove(d.key)} danger>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <textarea
                    rows={2}
                    value={d.en}
                    disabled={saving}
                    onChange={(e) => update(d.key, "en", e.target.value)}
                    placeholder="English"
                    className={cn(inputCls, "h-auto min-h-16 resize-y")}
                  />
                  <textarea
                    rows={2}
                    value={d.vi}
                    disabled={saving}
                    onChange={(e) => update(d.key, "vi", e.target.value)}
                    placeholder="Tiếng Việt"
                    className={cn(
                      inputCls,
                      "h-auto min-h-16 resize-y",
                      d.en.trim() && !d.vi.trim() && "border-amber-500"
                    )}
                  />
                </div>
                <input
                  value={d.alts}
                  disabled={saving}
                  onChange={(e) => update(d.key, "alts", e.target.value)}
                  placeholder="Cách nói khác được chấp nhận (ngăn cách bằng |), tuỳ chọn"
                  className={cn(inputCls, "mt-2 h-8 text-xs")}
                />
              </li>
            ))}
          </ol>
        </div>
      )}

      <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => insertAt(drafts.length)}>
        <Plus className="mr-1 h-4 w-4" />
        Thêm dòng
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
          <Check className="mr-1 h-4 w-4" />
          {saving ? "Đang lưu…" : "Lưu"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  danger,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30",
        danger ? "hover:text-destructive" : "hover:text-foreground"
      )}
      {...rest}
    />
  );
}