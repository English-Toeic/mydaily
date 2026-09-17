import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { LessonProgress, LessonStatus, ProgressState } from "@/types";

const initial: ProgressState = { lessons: {} };

export function useProgress() {
  const [state, setState] = useState<ProgressState>(initial);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setState(initial);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("lesson_progress")
      .select("*");

    if (error) {
      console.error("Load progress error:", error);
      setLoading(false);
      return;
    }

    const lessons: ProgressState["lessons"] = {};
    for (const row of data ?? []) {
      lessons[row.lesson_id] = {
        status: row.status,
        learnedSentenceIds: row.learned_sentence_ids ?? [],
        lastOpenedAt: row.last_opened_at ?? undefined,
      };
    }
    setState({ lessons });
    setLoading(false);
  }, []);

  // Load lần đầu + reload khi auth đổi
  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        load();
      } else {
        setState(initial);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  // Không phụ thuộc state → dùng functional read qua state trực tiếp
  const getLesson = useCallback(
    (id: number): LessonProgress =>
      state.lessons[id] ?? { status: "not-started", learnedSentenceIds: [] },
    [state.lessons]
  );

  const upsert = useCallback(async (lessonId: number, p: LessonProgress) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;

    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: u.user.id,
          lesson_id: lessonId,
          status: p.status,
          learned_sentence_ids: p.learnedSentenceIds,
          last_opened_at: p.lastOpenedAt,
        },
        { onConflict: "user_id,lesson_id" } // 👈 cần unique constraint
      );

    if (error) {
      console.error("Upsert progress error:", error);
    }
  }, []);

  const markSentenceLearned = useCallback(
    (lessonId: number, sentenceId: number, totalSentences: number) => {
      setState((prev) => {
        const cur = prev.lessons[lessonId] ?? {
          status: "learning" as LessonStatus,
          learnedSentenceIds: [],
        };
        const learned = cur.learnedSentenceIds.includes(sentenceId)
          ? cur.learnedSentenceIds
          : [...cur.learnedSentenceIds, sentenceId];
        const status: LessonStatus =
          learned.length >= totalSentences ? "completed" : "learning";

        const updated: LessonProgress = {
          status,
          learnedSentenceIds: learned,
          lastOpenedAt: new Date().toISOString(),
        };
        upsert(lessonId, updated);
        return { ...prev, lessons: { ...prev.lessons, [lessonId]: updated } };
      });
    },
    [upsert]
  );

  const openLesson = useCallback(
    (lessonId: number) => {
      setState((prev) => {
        const cur = prev.lessons[lessonId];
        if (cur?.status === "completed") return prev;
        const updated: LessonProgress = {
          status: "learning",
          learnedSentenceIds: cur?.learnedSentenceIds ?? [],
          lastOpenedAt: new Date().toISOString(),
        };
        upsert(lessonId, updated);
        return { ...prev, lessons: { ...prev.lessons, [lessonId]: updated } };
      });
    },
    [upsert]
  );

  const resetLesson = useCallback(
    (lessonId: number) => {
      setState((prev) => {
        const updated: LessonProgress = {
          status: "learning",
          learnedSentenceIds: [],
          lastOpenedAt: new Date().toISOString(),
        };
        upsert(lessonId, updated);
        return { ...prev, lessons: { ...prev.lessons, [lessonId]: updated } };
      });
    },
    [upsert]
  );

  return {
    getLesson,
    markSentenceLearned,
    openLesson,
    resetLesson,
    loading,
  };
}