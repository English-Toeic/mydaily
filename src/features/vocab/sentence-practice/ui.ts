import { AlertTriangle, Check, X } from "lucide-react";

export const TONES = {
  correct: {
    Icon: Check,
    dot: "bg-emerald-500",
    box: "border-emerald-500/30 bg-emerald-500/[0.06]",
    text: "text-emerald-700 dark:text-emerald-300",
    input: "border-emerald-500 bg-emerald-500/5",
  },
  almost: {
    Icon: AlertTriangle,
    dot: "bg-amber-500",
    box: "border-amber-500/30 bg-amber-500/[0.06]",
    text: "text-amber-700 dark:text-amber-300",
    input: "border-amber-500 bg-amber-500/5",
  },
  wrong: {
    Icon: X,
    dot: "bg-red-500",
    box: "border-red-500/30 bg-red-500/[0.06]",
    text: "text-red-700 dark:text-red-300",
    input: "border-red-500 bg-red-500/5",
  },
} as const;

export const pillBtn =
  "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border transition hover:bg-background hover:text-foreground touch-manipulation";