// lib/segments.ts
import type { PartKey } from "./aggregate";

export const SEGMENTS: { key: PartKey; label: string; bar: string }[] = [
  { key: "lesson",    label: "Bài học",  bar: "bg-sky-500" },
  { key: "vocab",     label: "Từ vựng",  bar: "bg-amber-500" },
  { key: "listening", label: "Nghe",     bar: "bg-violet-500" },
  { key: "other",     label: "Khác",     bar: "bg-muted-foreground/30" },
];