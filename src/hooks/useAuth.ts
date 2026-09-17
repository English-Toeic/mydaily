// src/hooks/useAuth.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

// Chuyển username -> email ảo & password cố định
function toCredentials(username: string) {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return {
    email: `${clean}@toeic-english.com`,
    password: `pw_${clean}_2024`, // password derive từ username
    username: clean,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (username: string) => {
    if (!username.trim()) {
      return { error: "Vui lòng nhập tên" };
    }
    const { email, password, username: clean } = toCredentials(username);

    // 1) Thử đăng nhập
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInErr) return { error: null };

    // 2) Chưa có tài khoản -> đăng ký
    const { error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: clean } }, // lưu username vào metadata
    });

    if (signUpErr) return { error: signUpErr.message };

    // 3) signUp xong thường đã có session luôn (khi tắt confirm email)
    //    Nếu chưa, đăng nhập lại cho chắc
    const { error: retryErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: retryErr?.message ?? null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const username =
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split("@")[0];

  return { user, username, loading, login, logout };
}