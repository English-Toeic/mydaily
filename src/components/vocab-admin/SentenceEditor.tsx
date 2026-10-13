import { useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SENTENCE_COUNT, parsePaste, type SentenceDraft } from "@/lib/sentences";
import { inputCls } from "./styles";

interface SentenceEditorProps {
  drafts: SentenceDraft[];
  filledCount: number;
  disabled?: boolean;
  onChange: (index: number, key: keyof SentenceDraft, value: string) => void;
  onReplaceAll: (drafts: SentenceDraft[]) => void;
}

const PASTE_PLACEHOLDER =
  "Tôi thường dậy sớm. | I usually get up early. | I often get up early.\nAnh ấy dậy lúc 6 giờ. | He gets up at 6 o'clock.";

export function SentenceEditor({
  drafts,
  filledCount,
  disabled,
  onChange,
  onReplaceAll,
}: SentenceEditorProps) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const applyPaste = () => {
    if (!pasteText.trim()) return;
    onReplaceAll(parsePaste(pasteText));
    setPasteText("");
    setPasteOpen(false);
  };

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Câu luyện tập{" "}
          <span className={cn(filledCount === SENTENCE_COUNT && "text-success")}>
            ({filledCount}/{SENTENCE_COUNT})
          </span>
          <span className="font-normal">
            {" "}· nhiều đáp án cách nhau bằng{" "}
            <code className="bg-muted px-1 rounded">|</code>
          </span>
        </p>
        <button
          type="button"
          onClick={() => setPasteOpen((v) => !v)}
          className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          Dán nhanh
        </button>
      </div>

      {pasteOpen && (
        <div className="space-y-2 p-2 rounded-md border bg-background">
          <p className="text-xs text-muted-foreground">
            Mỗi dòng 1 câu:{" "}
            <code className="bg-muted px-1 rounded">Câu tiếng Việt | English 1 | English 2</code>
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            placeholder={PASTE_PLACEHOLDER}
            className={cn(inputCls, "w-full font-mono text-xs")}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={applyPaste} disabled={!pasteText.trim()}>
              Áp dụng
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPasteOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      )}

      {drafts.map((d, i) => (
        <div
          key={i}
          className="grid grid-cols-[20px_1fr] sm:grid-cols-[20px_1fr_1fr] gap-2 items-center"
        >
          <span className="text-xs text-muted-foreground text-right">{i + 1}.</span>
          <input
            value={d.vi}
            disabled={disabled}
            onChange={(e) => onChange(i, "vi", e.target.value)}
            placeholder="Câu tiếng Việt"
            className={inputCls}
          />
          <input
            value={d.en}
            disabled={disabled}
            onChange={(e) => onChange(i, "en", e.target.value)}
            placeholder="English (đáp án 1 | đáp án 2)"
            className={cn(inputCls, "col-start-2 sm:col-start-auto")}
          />
        </div>
      ))}
    </div>
  );
}