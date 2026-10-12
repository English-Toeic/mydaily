import { Play, RotateCcw } from "lucide-react";
import type { LessonFilter, LessonStatus, StatusMeta } from "./types";

export const STATUS_META: Record<LessonStatus, StatusMeta> = {
  completed: {
    label: "Hoàn thành",
    action: "Ôn lại",
    actionIcon: RotateCcw,
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    ring: "stroke-emerald-500",
    cardHover: "hover:border-emerald-500/40",
  },
  learning: {
    label: "Đang học",
    action: "Tiếp tục",
    actionIcon: Play,
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    ring: "stroke-blue-500",
    cardHover: "hover:border-blue-500/40",
  },
  "not-started": {
    label: "Chưa học",
    action: "Bắt đầu",
    actionIcon: Play,
    badge: "bg-muted text-muted-foreground",
    ring: "stroke-primary",
    cardHover: "hover:border-primary/40",
  },
};

export const FILTERS: ReadonlyArray<{ value: LessonFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "learning", label: "Đang học" },
  { value: "not-started", label: "Chưa học" },
  { value: "completed", label: "Hoàn thành" },
];

/** Giới hạn số thẻ có delay, tránh danh sách dài phải chờ lâu */
export const STAGGER_MAX = 10;
export const STAGGER_STEP_MS = 40;