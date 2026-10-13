import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Word } from "@/types/vocab";
import { parseBulk, type BulkRow } from "@/lib/bulk-import";
import { inputCls } from "./styles";

interface BulkImportPanelProps {
  existingWords: Word[];
  busy: boolean;
  onImport: (rows: BulkRow[]) => Promise<boolean>;
  onClose: () => void;
}

export function BulkImportPanel({ existingWords, busy, onImport, onClose }: BulkImportPanelProps) {
  const [text, setText] = useState("");

  const parsed = useMemo(
    () => parseBulk(text, existingWords.map((w) => w.english)),
    [text, existingWords]
  );

  const handleImport = async () => {
    if (parsed.rows.length === 0) {
      alert("Không có dòng hợp lệ. Định dạng: english | meaning | ipa");
      return;
    }
    if (await onImport(parsed.rows)) setText("");
  };

  return (
    <div className="mb-4 p-3 rounded-lg border space-y-2">
      <p className="text-xs text-muted-foreground">
        Mỗi dòng 1 từ, định dạng:{" "}
        <code className="bg-muted px-1 rounded">english | meaning | ipa</code> (ipa tùy chọn,
        có thể dùng Tab thay cho <code>|</code>). Câu luyện tập thêm sau bằng nút ✏️.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"prevent | ngăn chặn | /prɪˈvent/\nachieve | đạt được"}
        className={cn(inputCls, "w-full font-mono")}
      />

      {text.trim() && (
        <div className="text-xs space-y-0.5">
          <p className="text-success">✓ {parsed.rows.length} từ hợp lệ</p>
          {parsed.duplicates.length > 0 && (
            <p className="text-muted-foreground">
              ↷ Bỏ qua {parsed.duplicates.length} từ trùng: {parsed.duplicates.slice(0, 5).join(", ")}
              {parsed.duplicates.length > 5 && "…"}
            </p>
          )}
          {parsed.invalidLines.length > 0 && (
            <p className="text-destructive">
              ✗ Dòng lỗi: {parsed.invalidLines.slice(0, 10).join(", ")}
              {parsed.invalidLines.length > 10 && "…"}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={() => void handleImport()} disabled={busy || parsed.rows.length === 0}>
          {busy ? "Đang nhập…" : `Nhập ${parsed.rows.length || ""} từ`}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}