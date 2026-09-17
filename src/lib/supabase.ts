// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./constants";

const url = SUPABASE_URL;
const key = SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_PUBLISHABLE_KEY");
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,      // lưu session vào localStorage
    autoRefreshToken: true,    // tự refresh khi hết hạn
    detectSessionInUrl: false, // Vite SPA, không cần đọc token từ URL
  },
});