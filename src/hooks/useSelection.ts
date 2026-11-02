import { useCallback, useState } from "react";

export function useSelection() {
  const [ids, setIds] = useState<Set<number>>(() => new Set());

  const toggle = useCallback(
    (id: number) =>
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    []
  );

  const setMany = useCallback(
    (list: number[], selected: boolean) =>
      setIds((prev) => {
        const next = new Set(prev);
        for (const id of list) {
          if (selected) next.add(id);
          else next.delete(id);
        }
        return next;
      }),
    []
  );

  // Trả lại đúng state cũ khi đã rỗng để không render thừa
  const clear = useCallback(() => setIds((prev) => (prev.size ? new Set() : prev)), []);

  return { ids, toggle, setMany, clear };
}