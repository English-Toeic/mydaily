// src/App.tsx
import { useAuth } from "@/hooks/useAuth";
import { MainApp } from "@/MainApp";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "./components/LoginForm";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
        <GraduationCap className="h-10 w-10 animate-pulse text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải dữ liệu…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginForm />
    );
  }

  // ✅ Auth sẵn sàng → mới mount phần dùng hook DB
  return <MainApp />;
}