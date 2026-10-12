import { cn } from "@/lib/utils";
import { STATUS_META } from "./config";
import { LessonCardIcon } from "./LessonCardIcon";
import { StatusBadge } from "./StatusBadge";
import { pad } from "./utils";
import type { LessonItem } from "./types";

type Props = {
  item: LessonItem;
  isNext: boolean;
  onOpen: (lessonId: number) => void;
};

export function LessonCard({ item, isNext, onOpen }: Props) {
  const { lesson, order, status, learned, total, available } = item;
  const meta = STATUS_META[status];
  const ActionIcon = meta.actionIcon;

  const ariaLabel = available
    ? `Bài ${order}: ${lesson.title}. ${meta.label}, ${learned} trên ${total} câu. ${meta.action}`
    : `Bài ${order}: ${lesson.title}. Chưa có dữ liệu`;

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => onOpen(lesson.id)}
      aria-label={ariaLabel}
      className={cn(
        "group relative flex h-full w-full flex-col gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-all duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        available
          ? cn(
              "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:hover:translate-y-0",
              meta.cardHover
            )
          : "cursor-not-allowed border-dashed bg-muted/30 shadow-none",
        isNext && "border-primary/50 ring-1 ring-primary/25"
      )}
    >
      {isNext && (
        <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
          Tiếp theo
        </span>
      )}

      <div className="flex items-start gap-3">
        <LessonCardIcon item={item} />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Bài {pad(order)}</span>
            {available && <StatusBadge status={status} />}
          </div>
          <h3 className="line-clamp-2 font-semibold leading-snug">{lesson.title}</h3>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between text-sm">
        <span className="text-muted-foreground tabular-nums">
          {available
            ? `${learned}/${total} câu`
            : lesson.parts
              ? `Sắp có · ${lesson.parts} câu`
              : "Chưa có dữ liệu"}
        </span>

        {available && (
          <span className="inline-flex items-center gap-1 font-medium text-primary transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
            {meta.action}
            <ActionIcon className="size-3.5" aria-hidden />
          </span>
        )}
      </div>
    </button>
  );
}