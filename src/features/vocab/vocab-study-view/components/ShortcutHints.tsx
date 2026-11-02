import { Kbd } from "@/components/ui/kbd";

/** Phím tắt: ẩn trên mobile */
export function ShortcutHints({ checked, canListen }: { checked: boolean; canListen: boolean }) {
  return (
    <p className="hidden items-center justify-center gap-3 text-xs text-muted-foreground sm:flex">
      <span>
        <Kbd>Enter</Kbd> {checked ? "tiếp tục" : "kiểm tra"}
      </span>
      {canListen && (
        <>
          <span className="text-border">|</span>
          <span>
            <Kbd>Ctrl</Kbd> nghe lại
          </span>
        </>
      )}
    </p>
  );
}