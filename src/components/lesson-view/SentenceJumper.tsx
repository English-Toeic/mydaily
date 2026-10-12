import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ChevronDown, CornerDownLeft, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  current: number;
  /** learned[i] = câu i đã thuộc */
  learned: boolean[];
  /** -1 nếu không còn câu chưa thuộc */
  nextUnlearned: number;
  onJump: (index: number) => void;
};

export function SentenceJumper({ current, learned, nextUnlearned, onJump }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const total = learned.length;

  const close = (refocus = false) => {
    setOpen(false);
    setValue("");
    if (refocus) toggleRef.current?.focus();
  };

  const jump = (index: number) => {
    onJump(index);
    close(); // không focus lại nút toggle, để ô trả lời tự focus khi sang câu mới
  };

  // Đóng khi click ra ngoài hoặc bấm Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Bài dài: cuộn để câu hiện tại nằm trong khung nhìn
  useEffect(() => {
    if (!open) return;
    gridRef.current
      ?.querySelector('[aria-current="step"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const parsed = Number(value);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= total;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) jump(parsed - 1);
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={toggleRef}
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
        className="gap-1 tabular-nums"
      >
        Câu {current + 1}/{total}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Chọn câu"
          data-hotkeys-ignore
          className="absolute bottom-full left-1/2 z-20 mb-2 w-[min(22rem,90vw)] -translate-x-1/2 space-y-3 rounded-xl border bg-popover p-3 shadow-lg animate-in fade-in zoom-in-95"
        >
          {/* Nhảy nhanh theo số */}
          <form onSubmit={submit} className="flex gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={total}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Đến câu (1–${total})`}
              aria-label="Số thứ tự câu"
              autoFocus
              className="h-9"
            />
            <Button type="submit" size="sm" disabled={!valid} aria-label="Đi đến câu">
              <CornerDownLeft className="h-4 w-4" />
            </Button>
          </form>

          {/* Lưới câu */}
          <div
            ref={gridRef}
            className="grid max-h-56 grid-cols-8 gap-1.5 overflow-y-auto p-0.5"
          >
            {learned.map((isLearned, i) => {
              const isCurrent = i === current;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => jump(i)}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Câu ${i + 1}${isLearned ? ", đã thuộc" : ""}${isCurrent ? ", đang học" : ""}`}
                  className={cn(
                    "aspect-square rounded-md text-xs font-medium tabular-nums transition-colors",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isLearned
                        ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Chú thích và lối tắt */}
          <div className="flex items-center justify-between gap-2 border-t pt-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Legend className="bg-primary" label="Hiện tại" />
              <Legend className="bg-emerald-500/40" label="Đã thuộc" />
              <Legend className="bg-muted-foreground/30" label="Chưa thuộc" />
            </div>
            {nextUnlearned !== -1 && nextUnlearned !== current && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => jump(nextUnlearned)}
              >
                <SkipForward className="h-3.5 w-3.5" /> Chưa thuộc
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Nhỏ và chỉ dùng ở đây nên để chung file */
function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2.5 w-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}