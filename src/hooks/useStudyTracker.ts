import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { todayKey, diffDays } from "@/lib/storage";
import type { StudyState } from "@/types";

const IDLE_MS = 30_000;
const TICK_MS = 1_000;
const FLUSH_MS = 15_000;

const ACTIVITY_EVENTS = ["keydown", "pointerdown", "input", "wheel", "touchstart"] as const;

const initial: StudyState = { daily: {}, streak: 0 };

async function getUserId() {
  // getSession đọc từ bộ nhớ, không gọi mạng như getUser
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export function useStudyTracker(active: boolean) {
  const [state, setState] = useState<StudyState>(initial);
  const [ready, setReady] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  const readyRef = useRef(false);
  const lastActionRef = useRef(Date.now());
  const dirtyRef = useRef(false);

  // ---- Load ban đầu ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: daily }, { data: meta }] = await Promise.all([
        supabase.from("study_daily").select("day, seconds"),
        supabase.from("study_meta").select("streak, last_study_date").maybeSingle(),
      ]);
      if (cancelled) return;

      const dailyMap: Record<string, number> = {};
      (daily ?? []).forEach((r) => (dailyMap[r.day] = r.seconds));

      const today = todayKey();
      setState((prev) => ({
        // Cộng dồn số giây đã đếm trong lúc chờ load, không ghi đè
        daily: { ...dailyMap, [today]: (dailyMap[today] ?? 0) + (prev.daily[today] ?? 0) },
        streak: meta?.streak ?? 0,
        lastStudyDate: meta?.last_study_date ?? undefined,
      }));
      readyRef.current = true;
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const registerActivity = useCallback(() => {
    lastActionRef.current = Date.now();
  }, []);

  // ---- Flush: đọc state qua ref, không gây side effect trong setState ----
  const flush = useCallback(async () => {
    if (!dirtyRef.current || !readyRef.current) return; // chưa load xong thì không ghi đè DB
    dirtyRef.current = false;

    const uid = await getUserId();
    if (!uid) {
      dirtyRef.current = true;
      return;
    }

    const today = todayKey();
    const seconds = stateRef.current.daily[today] ?? 0;
    const { error } = await supabase
      .from("study_daily")
      .upsert({ user_id: uid, day: today, seconds });
    if (error) dirtyRef.current = true; // lỗi mạng thì lần sau thử lại
  }, []);

  // ---- Streak: chỉ chạy khi đã có dữ liệu từ DB ----
  const bumpStreak = useCallback(async () => {
    if (!readyRef.current) return;
    const prev = stateRef.current;
    const today = todayKey();
    if (prev.lastStudyDate === today) return;

    const d = prev.lastStudyDate ? diffDays(prev.lastStudyDate, today) : null;
    const streak = d === 1 ? prev.streak + 1 : 1;

    setState((s) => ({ ...s, streak, lastStudyDate: today }));

    const uid = await getUserId();
    if (!uid) return;
    await supabase
      .from("study_meta")
      .upsert({ user_id: uid, streak, last_study_date: today });
  }, []);

  // ---- Tự nhận biết hoạt động khi đang học ----
  useEffect(() => {
    if (!active) return;
    lastActionRef.current = Date.now(); // vào bài là bắt đầu tính ngay

    const onActivity = () => {
      lastActionRef.current = Date.now();
    };
    const opts = { capture: true, passive: true } as const;
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, opts));
    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity, opts));
    };
  }, [active]);

  // ---- Đếm giây ----
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      if (Date.now() - lastActionRef.current > IDLE_MS) return;
      const today = todayKey();
      dirtyRef.current = true;
      setState((prev) => ({
        ...prev,
        daily: { ...prev.daily, [today]: (prev.daily[today] ?? 0) + 1 },
      }));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [active]);

  // ---- Flush định kỳ và khi rời trang ----
  useEffect(() => {
    const t = setInterval(flush, FLUSH_MS);
    const onVisibility = () => {
      if (document.hidden) flush();
      else lastActionRef.current = Date.now(); // quay lại tab thì tính là hoạt động
    };
    const onUnload = () => flush();
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(t);
      flush();
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);

  const todaySeconds = state.daily[todayKey()] ?? 0;

  return { state, ready, todaySeconds, streak: state.streak, registerActivity, bumpStreak };
}