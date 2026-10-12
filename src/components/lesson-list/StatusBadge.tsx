import { cn } from "@/lib/utils";
import { STATUS_META } from "./config";
import type { LessonStatus } from "./types";

export function StatusBadge({ status, className }: { status: LessonStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium leading-none",
        meta.badge,
        className
      )}
    >
      {meta.label}
    </span>
  );
}