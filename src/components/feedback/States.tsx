import type { ReactNode } from "react";
import { AlertCircle, Loader2, RefreshCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto mt-10 max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <p className="mb-1 font-semibold text-destructive">Không tải được dữ liệu</p>
      <p className="mb-5 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> Thử lại
        </Button>
      )}
    </div>
  );
}

export function NotFoundState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="mb-5 text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onBack}>Quay lại</Button>
    </div>
  );
}

/** Chỉ render children khi dữ liệu đã sẵn sàng */
export function DataGate({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null | undefined;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  return <>{children}</>;
}