// components/VocabStates.tsx
import { AlertCircle, BookOpen, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
    >
      <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </div>
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
        <RefreshCw className="size-4" /> Thử lại
      </Button>
    </div>
  );
}

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
        <BookOpen className="size-6" />
      </div>
      <h2 className="font-semibold">Chưa có deck nào</h2>
      <p className="text-sm text-muted-foreground">Tạo deck đầu tiên để bắt đầu học từ vựng.</p>
      <Button onClick={onCreate} className="mt-1 gap-1.5">
        <Plus className="size-4" /> Tạo deck
      </Button>
    </div>
  );
}

const SKELETON_ROWS = [70, 55, 80, 45, 60];

export function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Đang tải danh sách deck"
      aria-busy="true"
      className="flex animate-pulse flex-col gap-4"
    >
      <div className="h-24 rounded-2xl bg-muted" />
      <div className="h-10 rounded-xl bg-muted" />
      <div className="divide-y overflow-hidden rounded-2xl border">
        {SKELETON_ROWS.map((w, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="size-5 shrink-0 rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded bg-muted" style={{ width: `${w}%` }} />
              <div className="h-1 w-1/3 rounded-full bg-muted" />
            </div>
            <div className="h-8 w-14 shrink-0 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}