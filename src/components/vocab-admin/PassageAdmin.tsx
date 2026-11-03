import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Passage, PassageFields, PassageKind } from "@/types/passage";
import { PASSAGE_KIND_LABEL } from "@/types/passage";
import { speakersOf } from "@/lib/passage-parse";
import { PassageEditor } from "./PassageEditor";

interface Props {
  kind: PassageKind;
  /** Bài của deck đang chọn (mọi loại) */
  passages: Passage[];
  onSave: (fields: PassageFields, editing: Passage | null) => Promise<boolean>;
  onDelete: (passage: Passage) => Promise<void>;
}

export function PassageAdmin({ kind, passages, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<Passage | "new" | null>(null);
  const label = PASSAGE_KIND_LABEL[kind];
  const list = passages.filter((p) => p.kind === kind);

  if (editing) {
    const initial = editing === "new" ? null : editing;
    return (
      <PassageEditor
        key={initial?.id ?? "new"}
        kind={kind}
        initial={initial}
        onCancel={() => setEditing(null)}
        onSave={async (fields) => {
          const ok = await onSave(fields, initial);
          if (ok) setEditing(null);
          return ok;
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {list.length} {label.toLowerCase()}
        </span>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus className="mr-1 h-4 w-4" />
          Thêm {label.toLowerCase()}
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Chưa có {label.toLowerCase()} nào trong deck này
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {list.map((p) => {
            const speakers = speakersOf(p.lines);
            return (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.lines.length} {kind === "dialogue" ? "lượt" : "câu"}
                    {speakers.length > 0 && ` · ${speakers.join(", ")}`}
                  </p>
                </div>
                <Button size="icon" variant="ghost" aria-label="Sửa" onClick={() => setEditing(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Xóa"
                  className="text-destructive"
                  onClick={() => void onDelete(p)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}