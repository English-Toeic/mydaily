import { cn } from "@/lib/utils";
import type { DiffToken } from "@/lib/passage-grade";

export function DiffView({ tokens }: { tokens: DiffToken[] }) {
  if (!tokens.length) return null;
  return (
    <div className="space-y-1">
      <p className="flex flex-wrap gap-x-1 gap-y-0.5 text-sm leading-relaxed">
        {tokens.map((t, i) => (
          <span
            key={i}
            className={cn(
              t.kind === "missing" &&
                "rounded bg-emerald-500/15 px-0.5 font-medium text-emerald-700 dark:text-emerald-400",
              t.kind === "extra" && "text-red-600 line-through decoration-2 dark:text-red-400"
            )}
          >
            {t.text}
          </span>
        ))}
      </p>
      <p className="text-[11px] text-muted-foreground">
        <span className="text-emerald-600">Xanh</span> = còn thiếu ·{" "}
        <span className="text-red-600 line-through">gạch đỏ</span> = thừa hoặc sai
      </p>
    </div>
  );
}