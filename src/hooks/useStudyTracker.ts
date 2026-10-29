import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { StudyState } from "@/types";
import { STREAK_MIN_SECONDS } from "@/lib/study";

/** Không thao tác quá thời gian này thì dừng đếm */
export const IDLE_MS = 5_000;

const TICK_MS = 1_000;
const FLUSH_MS = 15_000;

const ACTIVITY_EVENTS = [
  "keydown", "pointerdown", "input", "wheel", "touchstart", "compositionupdate",
] as const;

/* ---------- Ngày theo giờ địa phương (tránh lệch UTC: 0h–7h ở VN) ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const addDays = (key: string, n: number) => {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};

/* ---------- Streak suy ra từ dữ liệu từng ngày ---------- */
export function computeStreak(daily: Record<string, number>, today: string) {
  const done = (k: string) => (daily[k] ?? 0) >= STREAK_MIN_SECONDS;
  const doneToday = done(today);

  // Hôm nay chưa học đủ thì chuỗi vẫn còn nếu hôm qua có học
  let cursor = doneToday ? today : addDays(today, -1);
  let streak = 0;
  while (done(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const lastStudyDate = Object.keys(daily)
    .filter(done)
    .reduce<string | undefined>((max, k) => (!max || k > max ? k : max), undefined);

  return { streak, doneToday, lastStudyDate };
}

/* ---------- Hook ---------- */
export function useStudyTracker(active: boolean) {
  const [daily, setDaily] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [idle, setIdle] = useState(true);
  const [today, setToday] = useState(dayKey);

  const readyRef = useRef(false);
  const lastActionRef = useRef(0);
  const lastTickRef = useRef(0);
  const carryMsRef = useRef(0); // phần lẻ < 1s chưa cộng
  const pendingRef = useRef<Record<string, number>>({}); // giây chưa lưu, theo ngày
  const flushingRef = useRef(false);

  // ---- Load ban đầu ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("study_daily")
        .select("day, seconds")
        .order("day", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (error) setLoadError(error.message);

      const fromDb: Record<string, number> = {};
      (data ?? []).forEach((r) => (fromDb[r.day] = r.seconds));

      // Cộng phần đã đếm trong lúc chờ load (chưa flush vì flush đợi ready)
      setDaily((local) => {
        const merged = { ...fromDb };
        for (const [k, v] of Object.entries(local)) merged[k] = (merged[k] ?? 0) + v;
        return merged;
      });
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

  // ---- Flush: gửi phần cộng thêm (delta), an toàn với nhiều tab/thiết bị ----
  const flush = useCallback(async () => {
    if (!readyRef.current || flushingRef.current) return;
    const entries = Object.entries(pendingRef.current).filter(([, s]) => s > 0);
    if (!entries.length) return;

    pendingRef.current = {};
    flushingRef.current = true;
    try {
      const results = await Promise.all(
        entries.map(([day, seconds]) =>
          supabase.rpc("add_study_seconds", { p_day: day, p_seconds: seconds })
        )
      );
      // Lỗi (mất mạng, hết phiên…) thì trả lại hàng đợi để lần sau gửi tiếp
      results.forEach(({ error }, i) => {
        if (!error) return;
        const [day, s] = entries[i];
        pendingRef.current[day] = (pendingRef.current[day] ?? 0) + s;
      });
    } finally {
      flushingRef.current = false;
    }
  }, []);

  // ---- Theo dõi thao tác + đếm thời gian khi đang học ----
  useEffect(() => {
    if (!active) return;

    const start = Date.now();
    lastActionRef.current = start; // vào bài là bắt đầu tính
    lastTickRef.current = start;
    carryMsRef.current = 0;

    const onActivity = () => {
      lastActionRef.current = Date.now();
    };
    const opts = { capture: true, passive: true } as const;
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, opts));

    const tick = () => {
      const now = Date.now();
      const from = lastTickRef.current;
      lastTickRef.current = now;

      // Chỉ tab đang hiển thị và có focus mới được đếm → không đếm đôi khi mở nhiều tab
      const focused = !document.hidden && document.hasFocus();
      setIdle(!(focused && now - lastActionRef.current < IDLE_MS));
      if (!focused) return;

      // Chỉ tính đến đúng thời điểm (thao tác cuối + IDLE_MS), không làm tròn lên cả tick
      const until = Math.min(now, lastActionRef.current + IDLE_MS);
      if (until <= from) return;

      carryMsRef.current += until - from;
      const secs = Math.floor(carryMsRef.current / 1000);
      if (!secs) return;
      carryMsRef.current -= secs * 1000;

      const day = dayKey();
      setToday(day);
      pendingRef.current[day] = (pendingRef.current[day] ?? 0) + secs;
      setDaily((prev) => ({ ...prev, [day]: (prev[day] ?? 0) + secs }));
    };

    // Quay lại tab/cửa sổ: không tính khoảng thời gian đã rời đi
    const resetTick = () => {
      lastTickRef.current = Date.now();
    };
    window.addEventListener("focus", resetTick);
    document.addEventListener("visibilitychange", resetTick);

    const timer = setInterval(tick, TICK_MS);
    return () => {
      tick(); // chốt phần đang đếm dở trước khi rời bài
      clearInterval(timer);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity, opts));
      window.removeEventListener("focus", resetTick);
      document.removeEventListener("visibilitychange", resetTick);
    };
  }, [active]);

  // ---- Flush định kỳ, khi ẩn tab và khi rời trang ----
  useEffect(() => {
    const t = setInterval(() => {
      setToday(dayKey()); // cập nhật khi qua nửa đêm kể cả lúc không học
      flush();
    }, FLUSH_MS);
    const onVisibility = () => {
      if (document.hidden) flush();
      else setToday(dayKey());
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(t);
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);

  const { streak, doneToday, lastStudyDate } = useMemo(
    () => computeStreak(daily, today),
    [daily, today]
  );

  const state: StudyState = useMemo(
    () => ({ daily, streak, lastStudyDate }),
    [daily, streak, lastStudyDate]
  );

  return {
    state,
    ready,
    loadError,
    today,
    todaySeconds: daily[today] ?? 0,
    streak,
    streakDoneToday: doneToday,
    /** Đang thực sự đếm giờ (đang ở bài + có thao tác trong 5s gần nhất) */
    counting: active && !idle,
    registerActivity,
  };
}