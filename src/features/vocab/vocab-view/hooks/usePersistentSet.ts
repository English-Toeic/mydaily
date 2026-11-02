// hooks/usePersistentSet.ts
import { useEffect, useState } from "react";

function read(key: string): Set<number> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(raw)) return new Set<number>();
    return new Set<number>(raw.filter((x): x is number => typeof x === "number"));
  } catch {
    return new Set<number>();
  }
}

export function usePersistentSet(key: string) {
  const [set, setSet] = useState<Set<number>>(() => read(key));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify([...set]));
    } catch {
      /* private mode hoặc hết dung lượng: bỏ qua */
    }
  }, [key, set]);

  return [set, setSet] as const;
}