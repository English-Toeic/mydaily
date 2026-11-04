import { createStore, get, update } from "idb-keyval";
import { supabase } from "@/lib/supabase";
import type { StudyKind } from "@/types";
import type { WordStatus } from "@/types/vocab";

export type Op =
  | { type: "word.grade"; wordId: number; status: WordStatus; correct_count: number }
  | { type: "word.accept"; wordId: number; key: string; text: string }
  | { type: "passage.result"; passageId: number; best_score: number; last_practiced_at: string }
  | { type: "study.add"; day: string; kind: StudyKind; seconds: number };

export type OutboxItem = { id: string; op: Op; attempts: number; createdAt: number };

const store = createStore("mydaily-outbox", "kv");
const KEY = "ops";
const MAX_ATTEMPTS = 8; // lỗi phía server quá 8 lần thì bỏ, tránh kẹt hàng đợi

const newItem = (op: Op): OutboxItem => ({
  id: crypto.randomUUID(), op, attempts: 0, createdAt: Date.now(),
});

const mutate = (fn: (items: OutboxItem[]) => OutboxItem[]) =>
  update<OutboxItem[]>(KEY, (cur) => fn(cur ?? []), store);

export async function listOps(): Promise<OutboxItem[]> {
  try {
    return (await get<OutboxItem[]>(KEY, store)) ?? [];
  } catch {
    return [];
  }
}

/* ---------- Gộp thao tác để hàng đợi không phình to ---------- */
function mergeInto(items: OutboxItem[], op: Op): OutboxItem[] {
  switch (op.type) {
    case "word.grade": {
      // Giá trị tuyệt đối → chỉ cần bản mới nhất (id mới để không bị xóa nhầm khi bản cũ đang gửi)
      const rest = items.filter((i) => !(i.op.type === "word.grade" && i.op.wordId === op.wordId));
      return [...rest, newItem(op)];
    }
    case "passage.result": {
      const old = items.find((i) => i.op.type === "passage.result" && i.op.passageId === op.passageId);
      const rest = items.filter((i) => i !== old);
      if (old?.op.type !== "passage.result") return [...rest, newItem(op)];
      return [...rest, newItem({
        ...op,
        best_score: Math.max(old.op.best_score, op.best_score),
        last_practiced_at: old.op.last_practiced_at > op.last_practiced_at
          ? old.op.last_practiced_at : op.last_practiced_at,
      })];
    }
    case "word.accept": {
      const dup = items.some((i) => i.op.type === "word.accept" &&
        i.op.wordId === op.wordId && i.op.key === op.key && i.op.text === op.text);
      return dup ? items : [...items, newItem(op)];
    }
    case "study.add": {
      // Chỉ cộng dồn vào thao tác CHƯA từng gửi (đã gửi thì server có thể đã nhận op_id đó)
      const idx = items.findIndex((i) => i.attempts === 0 && i.op.type === "study.add" &&
        i.op.day === op.day && i.op.kind === op.kind);
      if (idx < 0) return [...items, newItem(op)];
      const cur = items[idx];
      if (cur.op.type !== "study.add") return items;
      const next = [...items];
      next[idx] = { ...cur, op: { ...cur.op, seconds: cur.op.seconds + op.seconds } };
      return next;
    }
  }
}

export async function enqueue(op: Op) {
  await mutate((items) => mergeInto(items, op));
  notify();
  scheduleSync();
}

/* ---------- Gửi lên server ---------- */
type ErrLike = { message?: string; code?: string } | null;

async function send({ id, op }: OutboxItem): Promise<ErrLike> {
  try {
    switch (op.type) {
      case "word.grade":
        return (await supabase.from("words")
          .update({ status: op.status, correct_count: op.correct_count })
          .eq("id", op.wordId)).error;
      case "word.accept":
        return (await supabase.rpc("accept_answer", {
          p_word_id: op.wordId, p_key: op.key, p_text: op.text,
        })).error;
      case "passage.result":
        return (await supabase.from("passages")
          .update({ best_score: op.best_score, last_practiced_at: op.last_practiced_at })
          .eq("id", op.passageId)).error;
      case "study.add":
        return (await supabase.rpc("add_study_seconds_once", {
          p_op_id: id, p_day: op.day, p_seconds: op.seconds, p_kind: op.kind,
        })).error;
    }
  } catch (e) {
    return { message: String(e) };
  }
}

/** Lỗi mạng / token hết hạn → thử lại sau. Lỗi có mã Postgres → lỗi thật */
const isTransient = (e: NonNullable<ErrLike>) =>
  !navigator.onLine || !e.code || e.code === "PGRST301" ||
  /fetch|network|load failed|timeout|jwt/i.test(e.message ?? "");

/** Khóa giữa các tab: chỉ 1 nơi gửi tại 1 thời điểm */
export function withOutboxLock<T>(fn: () => Promise<T>): Promise<T> {
  if (!("locks" in navigator)) return fn();
  return navigator.locks.request("mydaily-outbox", () => fn());
}

let running: Promise<void> | null = null;

export function syncOutbox(): Promise<void> {
  if (!navigator.onLine) return Promise.resolve();
  running ??= runSync().finally(() => { running = null; });
  return running;
}

async function runSync() {
  await withOutboxLock(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return; // chưa có token hợp lệ → đợi

    for (const { id } of await listOps()) {
      // "Nhận" item trong transaction: tăng attempts + lấy giá trị mới nhất để gửi
      let claimed: OutboxItem | undefined;
      await mutate((items) => items.map((i) => {
        if (i.id !== id) return i;
        claimed = { ...i, attempts: i.attempts + 1 };
        return claimed;
      }));
      if (!claimed) continue; // đã bị thay bằng bản mới hơn

      const error = await send(claimed);
      if (!error) {
        await mutate((items) => items.filter((i) => i.id !== id));
        continue;
      }
      if (isTransient(error)) break; // mất mạng → dừng, lần sau gửi tiếp
      if (claimed.attempts >= MAX_ATTEMPTS) {
        console.error("Bỏ thao tác lỗi:", claimed, error);
        await mutate((items) => items.filter((i) => i.id !== id));
      }
    }
  });
  notify();
}

let timer: ReturnType<typeof setTimeout> | undefined;
function scheduleSync() {
  clearTimeout(timer);
  timer = setTimeout(() => void syncOutbox(), 1000);
}

/* ---------- Thông báo cho UI ---------- */
const listeners = new Set<() => void>();
export function subscribeOutbox(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
function notify() { listeners.forEach((fn) => fn()); }

/** Gọi 1 lần khi khởi động app */
let started = false;
export function startOutboxSync() {
  if (started) return;
  started = true;
  window.addEventListener("online", () => void syncOutbox());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void syncOutbox();
  });
  setInterval(() => void syncOutbox(), 30_000);
  supabase.auth.onAuthStateChange((event) => {
    // setTimeout: không gọi supabase trực tiếp trong callback auth (dễ deadlock)
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") setTimeout(() => void syncOutbox(), 0);
  });
  void syncOutbox();
}