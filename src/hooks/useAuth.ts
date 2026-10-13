import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setRawUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setRawUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
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
  }, []);

  return { user, loading, login, logout };
}