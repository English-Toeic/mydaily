// src/components/LoginForm.tsx
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await login(name);
    setLoading(false);
    if (error) setErr(error);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-xs mx-auto">
      <h1 className="text-xl font-bold text-center">Nhập tên để bắt đầu</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên của bạn..."
        autoFocus
        className="border rounded px-3 py-2"
      />
      {err && <p className="text-red-500 text-sm">{err}</p>}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="bg-blue-600 text-white rounded py-2 disabled:opacity-50"
      >
        {loading ? "Đang vào..." : "Vào học"}
      </button>
    </form>
  );
}