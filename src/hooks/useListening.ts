import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CHOICE_KEYS,
  isChoiceKey,
  type ListeningChoice,
  type ListeningQuestion,
  type ListeningQuestionFields,
  type ListeningSet,
} from "@/types/listening";

const SET_COLUMNS = "id, title, last_practiced_at";
const Q_COLUMNS = "id, set_id, sort_order, image_url, audio_url, choices, correct, learned_at";

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** jsonb có thể bị sửa tay trên dashboard, nên luôn chuẩn hóa về đủ 4 đáp án A B C D */
function sanitizeChoices(raw: unknown): ListeningChoice[] {
  const list = (Array.isArray(raw) ? raw : []).filter(
    (c): c is Record<string, unknown> => !!c && typeof c === "object"
  );
  return CHOICE_KEYS.map((key, i) => {
    const c: Record<string, unknown> = list.find((x) => x.key === key) ?? list[i] ?? {};
    return { key, en: str(c.en), vi: str(c.vi) };
  });
}

type QRow = Omit<ListeningQuestion, "choices" | "correct"> & { choices: unknown; correct: unknown };
const toQuestion = (r: QRow): ListeningQuestion => ({
  ...r,
  choices: sanitizeChoices(r.choices),
  correct: isChoiceKey(r.correct) ? r.correct : "A",
});

// PostgrestError không phải instance của Error, nên cần đọc .message riêng
const errMsg = (e: unknown) => {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e && typeof e.message === "string") return e.message;
  return typeof e === "string" ? e : "Lỗi không xác định";
};

export function useListening() {
  const [sets, setSets] = useState<ListeningSet[]>([]);
  const [questions, setQuestions] = useState<ListeningQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const questionsRef = useRef(questions);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, q] = await Promise.all([
        supabase.from("listening_sets").select(SET_COLUMNS).order("id"),
        supabase
          .from("listening_questions")
          .select(Q_COLUMNS)
          .order("set_id")
          .order("sort_order")
          .order("id"),
      ]);
      if (s.error) throw s.error;
      if (q.error) throw q.error;
      setSets((s.data ?? []) as ListeningSet[]);
      setQuestions(((q.data ?? []) as QRow[]).map(toQuestion));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---------------- Bộ đề ----------------

  const addSet = useCallback(async (title: string) => {
    const { data, error } = await supabase
      .from("listening_sets")
      .insert({ title })
      .select(SET_COLUMNS)
      .single();
    if (error) throw error;
    const created = data as ListeningSet;
    setSets((prev) => [...prev, created]);
    return created;
  }, []);

  const updateSet = useCallback(async (id: number, title: string) => {
    const { error } = await supabase.from("listening_sets").update({ title }).eq("id", id);
    if (error) throw error;
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }, []);

  const deleteSet = useCallback(async (id: number) => {
    const { error } = await supabase.from("listening_sets").delete().eq("id", id);
    if (error) throw error;
    setSets((prev) => prev.filter((s) => s.id !== id));
    setQuestions((prev) => prev.filter((q) => q.set_id !== id)); // DB đã cascade
  }, []);

  // ---------------- Câu hỏi ----------------

  const addQuestion = useCallback(async (set_id: number, fields: ListeningQuestionFields) => {
    const sort_order =
      questionsRef.current
        .filter((q) => q.set_id === set_id)
        .reduce((max, q) => Math.max(max, q.sort_order), 0) + 1;
    const { data, error } = await supabase
      .from("listening_questions")
      .insert({ set_id, sort_order, ...fields })
      .select(Q_COLUMNS)
      .single();
    if (error) throw error;
    const created = toQuestion(data as QRow);
    setQuestions((prev) => [...prev, created]);
    return created;
  }, []);

  const updateQuestion = useCallback(async (id: number, fields: Partial<ListeningQuestionFields>) => {
    const { error } = await supabase.from("listening_questions").update(fields).eq("id", id);
    if (error) throw error;
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...fields } : q)));
  }, []);

  const deleteQuestion = useCallback(async (id: number) => {
    const { error } = await supabase.from("listening_questions").delete().eq("id", id);
    if (error) throw error;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }, []);

  // ---------------- Tiến độ (optimistic) ----------------

  /** Đánh dấu đã học. Không lưu đúng/sai */
  const markLearned = useCallback(async (id: number) => {
    const current = questionsRef.current.find((q) => q.id === id);
    if (!current || current.learned_at) return;
    const learned_at = new Date().toISOString();
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, learned_at } : q)));
    const { error } = await supabase.from("listening_questions").update({ learned_at }).eq("id", id);
    if (error) console.error(error);
  }, []);

  /** Đưa toàn bộ câu của bộ đề về "chưa học" */
  const resetProgress = useCallback(async (set_id: number) => {
    const { error } = await supabase
      .from("listening_questions")
      .update({ learned_at: null })
      .eq("set_id", set_id);
    if (error) throw error;
    setQuestions((prev) => prev.map((q) => (q.set_id === set_id ? { ...q, learned_at: null } : q)));
  }, []);

  const touchSet = useCallback(async (id: number) => {
    const last_practiced_at = new Date().toISOString();
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, last_practiced_at } : s)));
    const { error } = await supabase.from("listening_sets").update({ last_practiced_at }).eq("id", id);
    if (error) console.error(error);
  }, []);

  return {
    sets,
    questions,
    loading,
    error,
    refetch: fetchAll,
    addSet,
    updateSet,
    deleteSet,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    markLearned,
    resetProgress,
    touchSet,
  };
}

export type ListeningStore = ReturnType<typeof useListening>;