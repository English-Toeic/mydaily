import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { cn } from "@/lib/utils";

/** Đồng bộ xong nhanh hơn ngần này thì không hiện banner, tránh nháy */
const SHOW_SYNC_DELAY_MS = 600;

type View = { online: boolean; pending: number };

export function SyncBanner() {
  const { online, pending } = useSyncStatus();
  const wanted = !online || pending > 0;

  const [visible, setVisible] = useState(false);
  // Nội dung đang hiển thị, giữ lại khi mờ dần để chữ không đổi giữa chừng
  const [view, setView] = useState<View>({ online, pending });

  useEffect(() => {
    if (!wanted) {
      setVisible(false);
      return;
    }
    setView({ online, pending });
    if (!online) {
      setVisible(true);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), SHOW_SYNC_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [wanted, online, pending]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={cn(
        "pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4",
        "bottom-[max(1rem,env(safe-area-inset-bottom))]",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-md backdrop-blur",
          view.online
            ? "border-primary/30 bg-background/90 text-primary"
            : "border-amber-500/30 bg-amber-50/95 text-amber-700 dark:bg-amber-950/90 dark:text-amber-400"
        )}
      >
        {view.online ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CloudOff className="h-3.5 w-3.5" />
        )}
        {view.online
          ? `Đang đồng bộ ${view.pending} thay đổi…`
          : view.pending
            ? `Offline · ${view.pending} thay đổi sẽ tự đồng bộ khi có mạng`
            : "Offline · đang dùng dữ liệu đã lưu"}
      </div>
    </div>
  );
}