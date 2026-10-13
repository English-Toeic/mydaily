import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WordFormState } from "@/hooks/useWordForm";
import { SentenceEditor } from "./SentenceEditor";
import { inputCls } from "./styles";

interface WordFormProps {
  form: WordFormState;
  saving: boolean;
  onSubmit: () => void;
}

export function WordForm({ form, saving, onSubmit }: WordFormProps) {
  const isEditing = form.editingWord !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-3 mb-4 p-3 rounded-lg bg-muted/40 border",
        isEditing ? "border-primary/50" : "border-transparent"
      )}
    >
      {form.editingWord && (
        <p className="text-xs font-medium text-primary">
          Đang sửa: {form.editingWord.english}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          value={form.english}
          disabled={saving}
          onChange={(e) => form.setEnglish(e.target.value)}
          placeholder="English"
          className={inputCls}
        />
        <input
          value={form.meaning}
          disabled={saving}
          onChange={(e) => form.setMeaning(e.target.value)}
          placeholder="Nghĩa tiếng Việt"
          className={inputCls}
        />
        <input
          value={form.ipa}
          disabled={saving}
          onChange={(e) => form.setIpa(e.target.value)}
          placeholder="IPA (tùy chọn)"
          className={inputCls}
        />
      </div>

      <SentenceEditor
        drafts={form.drafts}
        filledCount={form.filledCount}
        disabled={saving}
        onChange={form.updateDraft}
        onReplaceAll={form.setDrafts}
      />

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving || !form.canSubmit}>
          {isEditing ? <Check className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {saving ? "Đang lưu…" : isEditing ? "Lưu" : "Thêm từ"}
        </Button>
        {isEditing && (
          <Button type="button" size="sm" variant="ghost" onClick={form.reset} disabled={saving}>
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
}