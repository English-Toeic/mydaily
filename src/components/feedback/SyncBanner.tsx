import { CloudOff, RefreshCw } from "lucide-react";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { cn } from "@/lib/utils";

export function SyncBanner() {
  const { online, pending } = useSyncStatus();
  if (online && pending === 0) return null;

  return (
    <div
      role="status"
      className={cn(
        "mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs",
        online
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      )}
    >
      {online ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CloudOff className="h-3.5 w-3.5" />}
      {online
        ? `Đang đồng bộ ${pending} thay đổi…`
        : pending
          ? `Offline · ${pending} thay đổi sẽ tự đồng bộ khi có mạng`
          : "Offline · đang dùng dữ liệu đã lưu"}
    </div>
  );
}