import { BarChart3, BookMarked, BookOpen, Settings, type LucideIcon } from "lucide-react";
import type { View, ViewName } from "@/app/routes";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  target: View;
  /** Các view được coi là "đang ở tab này" */
  activeOn: readonly ViewName[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Bài học", icon: BookOpen, target: { name: "sections" }, activeOn: ["sections", "lessons", "lesson"] },
  { label: "Từ vựng", icon: BookMarked, target: { name: "vocab" }, activeOn: ["vocab", "vocabStudy", "vocabAdmin"] },
  { label: "Thống kê", icon: BarChart3, target: { name: "stats" }, activeOn: ["stats"] },
  { label: "Quản lý", icon: Settings, target: { name: "admin" }, activeOn: ["admin"] },
];