import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { todayKey, diffDays } from "@/lib/storage";
import type { StudyState } from "@/types";

const IDLE_MS = 30_000;
const TICK_MS = 1_000;
const FLUSH_MS = 15_000; // gom rồi ghi DB mỗi 15s

const initial: StudyState = { daily: {}, streak: 0 };

export function useStudyTracker(active: boolean) {
  const [state, setState] = useState<StudyState>(initial);
  const lastActionRef = useRef(Date.now());
  const dirtyRef = useRef(false); // có thay đổi cần flush không

  // Load ban đầu
  useEffect(() => {
    (async () => {
      const [{ data: daily }, { data: meta }] = await Promise.all([
        supabase.from("study_daily").select("day, seconds"),
        supabase.from("study_meta").select("streak, last_study_date").single(),
      ]);
      const dailyMap: Record<string, number> = {};
      (daily ?? []).forEach((r) => (dailyMap[r.day] = r.seconds));
      setState({
        daily: dailyMap,
        streak: meta?.streak ?? 0,
        lastStudyDate: meta?.last_study_date ?? undefined,
      });
    })();
  }, []);

  const registerActivity = useCallback(() => {
    lastActionRef.current = Date.now();
  }, []);

  // Flush seconds hôm nay lên DB
  const flush = useCallback(async () => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const today = todayKey();
    setState((prev) => {
      supabase
        .from("study_daily")
        .upsert({ user_id: u.user!.id, day: today, seconds: prev.daily[today] ?? 0 })
        .then(() => {});
      return prev;
    });
  }, []);

  const bumpStreak = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setState((prev) => {
      const today = todayKey();
      if (prev.lastStudyDate === today) return prev;
      let streak = 1;
      if (prev.lastStudyDate) {
        const d = diffDays(prev.lastStudyDate, today);
        streak = d === 1 ? prev.streak + 1 : 1;
      }
      supabase.from("study_meta").upsert({
        user_id: u.user!.id,
        streak,
        last_study_date: today,
      }).then(() => {});
      return { ...prev, streak, lastStudyDate: today };
    });
  }, []);

  // Đếm giây
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
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

  // Flush định kỳ + khi rời trang
  useEffect(() => {
    const t = setInterval(flush, FLUSH_MS);
    const onHide = () => flush();
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(t);
      flush();
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  const todaySeconds = state.daily[todayKey()] ?? 0;

  return { state, todaySeconds, streak: state.streak, registerActivity, bumpStreak };
}