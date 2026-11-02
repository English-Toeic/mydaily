import { useEffect, useState } from "react";

function read(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === "on") return true;
    if (v === "off") return false;
    return fallback;
  } catch {
    return fallback;
  }
}

/** Cờ bật/tắt lưu vào localStorage dưới dạng "on" / "off" */
export function usePersistentFlag(key: string, fallback: boolean) {
  const [value, setValue] = useState(() => read(key, fallback));

  useEffect(() => {
    try {
      localStorage.setItem(key, value ? "on" : "off");
    } catch {
      /* private mode hoặc hết dung lượng: bỏ qua */
    }
  }, [key, value]);

  return [value, setValue] as const;
}