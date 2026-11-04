// ui.ts
import type { Counts } from "./lib/counts";

export type StatusKey = Exclude<keyof Counts, "total">;

export interface StatusMeta {
  key: StatusKey;
  label: string;
  short: string;
  text: string;
  dot: string;
}

export const STATUS: StatusMeta[] = [
  { key: "fresh", label: "Mới", short: "Mới", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  { key: "learning", label: "Đang học", short: "Học", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  { key: "learned", label: "Đã thuộc", short: "Thuộc", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
];

/** Cột số liệu: header và từng dòng phải cùng độ rộng để thẳng hàng */
export const COL = "w-10 shrink-0 text-center sm:w-12";
export const ACTION_COL = "w-35 shrink-0";