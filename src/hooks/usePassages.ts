import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Passage, PassageFields, PassageLine } from "@/types/passage";
import { enqueue, listOps, syncOutbox, withOutboxLock, type OutboxItem } from "@/lib/offline/outbox";
import { readCache, usePersistedCache } from "@/lib/offline/cache";

const COLUMNS = "id, deck_id, kind, title, lines, best_score, last_practiced_at";

const CACHE_KEY = "passages";

function applyPending(list: Passage[], items: OutboxItem[]): Passage[] {
  const res = new Map<number, { best_score: number; last_practiced_at: string }>();
  for (const { op } of items) if (op.type === "passage.result") res.set(op.passageId, op);
  if (!res.size) return list;
  return list.map((p) => {
    const r = res.get(p.id);
    return r
      ? { ...p, best_score: Math.max(p.best_score ?? 0, r.best_score), last_practiced_at: r.last_practiced_at }
      : p;
  });
}

/** jsonb có thể bị sửa tay trên dashboard, nên làm sạch trước khi dùng */
function sanitizeLines(raw: unknown): PassageLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): PassageLine[] => {
    if (!item || typeof item !== "object") return [];
    const o = item as Record<string, unknown>;
    const en = (Array.isArray(o.en) ? o.en : [o.en]).filter(
      (s): s is string => typeof s === "string" && s.trim() !== ""
    );
    if (!en.length) return [];
    return [{
      speaker: typeof o.speaker === "string" && o.speaker.trim() ? o.speaker : null,
      en,
      vi: typeof o.vi === "string" ? o.vi : "",
    }];
  });
}

type Row = Omit<Passage, "lines"> & { lines: unknown };
const toPassage = (row: Row): Passage => ({ ...row, lines: sanitizeLines(row.lines) });

const errMsg = (e: unknown) => (e instanceof Error ? e.message : typeof e === "string" ? e : "Lỗi không xác định");

export function usePassages() {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  usePersistedCache(CACHE_KEY, passages, hydrated);

  const fetchAll = useCallback(async () => {
    setError(null);
    const [cached, queued] = await Promise.all([readCache<Passage[]>(CACHE_KEY), listOps()]);
    if (cached) {
      setPassages(applyPending(cached, queued));
      setHydrated(true);
      setLoading(false);
    } else {
      setLoading(true);
    }
    
    try {
      if (!navigator.onLine) throw new Error("Đang offline và chưa có dữ liệu lưu sẵn.");
      await syncOutbox();
      const { rows, pending } = await withOutboxLock(async () => {
        const { data, error } = await supabase.from("passages").select(COLUMNS).order("id");
        if (error) throw error;
        return { rows: (data ?? []) as Row[], pending: await listOps() };
      });
      setPassages(applyPending(rows.map(toPassage), pending));
      setHydrated(true);
    } catch (e) {
      if (!cached) setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addPassage = useCallback(async (deck_id: number, fields: PassageFields) => {
    const { data, error } = await supabase
      .from("passages")
      .insert({ deck_id, ...fields })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    const created = toPassage(data as Row);
    setPassages((prev) => [...prev, created]);
    return created;
  }, []);

  const updatePassage = useCallback(async (id: number, fields: Partial<PassageFields>) => {
    const { error } = await supabase.from("passages").update(fields).eq("id", id);
    if (error) throw error;
    setPassages((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
  }, []);

  const deletePassage = useCallback(async (id: number) => {
    const { error } = await supabase.from("passages").delete().eq("id", id);
    if (error) throw error;
    setPassages((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /** Lưu kết quả luyện tập (optimistic). Chỉ giữ điểm cao nhất */
  const recordResult = useCallback(async (passage: Passage, score: number) => {
    const best_score = Math.max(passage.best_score ?? 0, score);
    const last_practiced_at = new Date().toISOString();
    setPassages((prev) =>
      prev.map((p) =>
        p.id === passage.id
          ? { ...p, best_score: Math.max(p.best_score ?? 0, score), last_practiced_at }
          : p
      )
    );
    await enqueue({ type: "passage.result", passageId: passage.id, best_score, last_practiced_at });
  }, []);

  return {
    passages,
    loading,
    error,
    refetch: fetchAll,
    addPassage,
    updatePassage,
    deletePassage,
    recordResult,
  };
}

export type PassageStore = ReturnType<typeof usePassages>;