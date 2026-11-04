import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { clearCache } from "@/lib/offline/cache";

const LAST_USER_KEY = "mydaily:last-user";

const readLastUser = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem(LAST_USER_KEY) ?? "null");
  } catch {
    return null;
  }
};

function translateError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Sai email hoặc mật khẩu";
  if (/email not confirmed/i.test(msg)) return "Email chưa được xác nhận";
  if (/network|fetch/i.test(msg)) return "Lỗi mạng, thử lại sau";
  return msg;
}

export function useAuth() {
  const [rawUser, setRawUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const apply = (session: Session | null) => {
      if (!mounted) return;
      if (session?.user) {
        localStorage.setItem(LAST_USER_KEY, JSON.stringify(session.user));
        setRawUser(session.user);
      } else if (!navigator.onLine) {
        setRawUser(readLastUser()); // offline + token hết hạn → vẫn cho học
      } else {
        setRawUser(null);
      }
      setLoading(false);
    };

    supabase.auth.getSession()
      .then(({ data }) => apply(data.session))
      .catch(() => apply(null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(LAST_USER_KEY);
        if (mounted) { setRawUser(null); setLoading(false); }
        return;
      }
      apply(session);
    });

    // Có mạng lại → lấy session thật (tự refresh token)
    const onOnline = () => {
      setTimeout(() => {
        supabase.auth.getSession().then(({ data }) => apply(data.session));
      }, 0);
    };
    window.addEventListener("online", onOnline);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("online", onOnline);
    };
  }, []);

  // Session ẩn danh cũ còn lưu trong trình duyệt → coi như chưa đăng nhập
  const user = rawUser && !rawUser.is_anonymous ? rawUser : null;

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(LAST_USER_KEY);
    await clearCache();
  }, []);

  return { user, loading, login, logout };
}