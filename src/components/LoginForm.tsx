import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    if (error) setErr(error);
  };

  const inputCls =
    "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="mb-2 flex flex-col items-center gap-2">
          <GraduationCap className="h-10 w-10 text-primary" />
          <h1 className="text-xl font-bold">Đăng nhập</h1>
        </div>

        <input
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoFocus
          required
          className={inputCls}
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          required
          className={inputCls}
        />

        {err && <p className="text-sm text-red-500">{err}</p>}

        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}