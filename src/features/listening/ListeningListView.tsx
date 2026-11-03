import { ChevronRight, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListeningQuestion, ListeningSet } from "@/types/listening";

interface Props {
  sets: ListeningSet[];
  questionsBySet: Map<number, ListeningQuestion[]>;
  onOpen: (setId: number) => void;
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "hôm nay";
  if (days === 1) return "hôm qua";
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function ListeningListView({ sets, questionsBySet, onOpen }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Nghe & chọn đáp án</h1>
        <p className="text-sm text-muted-foreground">Xem ảnh, nghe audio rồi chọn A, B, C hoặc D</p>
      </div>

      {sets.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Chưa có bộ đề nào. Thêm trong trang Quản lý, tab "Nghe".
        </p>
      ) : (
        <ul className="space-y-2">
          {sets.map((s) => {
            const qs = questionsBySet.get(s.id) ?? [];
            const learned = qs.filter((q) => q.learned_at).length;
            const pct = qs.length ? Math.round((learned / qs.length) * 100) : 0;
            const done = qs.length > 0 && learned === qs.length;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={qs.length === 0}
                  onClick={() => onOpen(s.id)}
                  className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Headphones className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {qs.length} câu · Đã học {learned}/{qs.length}
                      {s.last_practiced_at && ` · Luyện ${timeAgo(s.last_practiced_at)}`}
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full transition-all", done ? "bg-emerald-500" : "bg-primary")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}