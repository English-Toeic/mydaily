import { useEffect } from "react";
import { clear, createStore, get, set } from "idb-keyval";

const store = createStore("mydaily-cache", "kv");

export async function readCache<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key, store);
  } catch {
    return undefined;
  }
}

export async function writeCache(key: string, value: unknown) {
  try {
    await set(key, value, store);
  } catch (e) {
    console.error("writeCache", e);
  }
}

export const clearCache = () => clear(store).catch(console.error);

/** Tự lưu state vào cache (debounce) khi đã có dữ liệu thật */
export function usePersistedCache(key: string, value: unknown, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => void writeCache(key, value), 400);
    return () => clearTimeout(t);
  }, [key, value, enabled]);
}