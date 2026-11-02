// hooks/useExpanded.ts
import { useCallback } from "react";
import { usePersistentSet } from "./usePersistentSet";

const EXPANDED_KEY = "vocab:expanded";

export function useExpanded(parentIds: number[]) {
  const [expanded, setExpanded] = usePersistentSet(EXPANDED_KEY);

  const allOpen = parentIds.length > 0 && parentIds.every((id) => expanded.has(id));

  const toggle = useCallback(
    (id: number) =>
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [setExpanded]
  );

  const expandMany = useCallback(
    (ids: number[]) =>
      setExpanded((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      }),
    [setExpanded]
  );

  const toggleAll = () => setExpanded(allOpen ? new Set() : new Set(parentIds));

  return { expanded, allOpen, toggle, toggleAll, expandMany };
}