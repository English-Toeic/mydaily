import { useEffect, useState, useSyncExternalStore } from "react";
import { listOps, subscribeOutbox } from "@/lib/offline/outbox";

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function useSyncStatus() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = () => void listOps().then((l) => setPending(l.length));
    refresh();
    const off = subscribeOutbox(refresh);
    const t = setInterval(refresh, 10_000); // bắt cả thay đổi từ tab khác
    return () => { off(); clearInterval(t); };
  }, []);

  return { online, pending };
}