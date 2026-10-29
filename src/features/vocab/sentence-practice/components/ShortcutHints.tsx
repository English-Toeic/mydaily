// components/ShortcutHints.tsx
import { Kbd } from "@/components/ui/kbd";

export function ShortcutHints({ checked }: { checked: boolean }) {
  return (
    <p className="hidden items-center justify-center gap-3 text-xs text-muted-foreground sm:flex">
      <span><Kbd>Enter</Kbd> {checked ? "tiếp tục" : "kiểm tra"}</span>
      <span className="text-border">|</span>
      <span><Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> xuống dòng</span>
      {checked && (
        <>
          <span className="text-border">|</span>
          <span><Kbd>Ctrl</Kbd> nghe lại</span>
        </>
      )}
    </p>
  );
}