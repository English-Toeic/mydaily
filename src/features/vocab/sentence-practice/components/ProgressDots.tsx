// components/ProgressDots.tsx
import { cn } from "@/lib/utils";
import type { SentenceVerdict } from "@/lib/sentences";
import { TONES } from "../ui";

interface Props {
  total: number;
  index: number;
  results: { verdict: SentenceVerdict }[];
}

export function ProgressDots({ total, index, results }: Props) {
  return (
    <div
      role="progressbar"
      aria-label="Tiến độ luyện câu"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={index + 1}
      className="flex gap-1.5"
    >
      {Array.from({ length: total }, (_, i) => {
        const r = results[i];
        return (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors duration-300",
              r ? TONES[r.verdict].dot : i === index ? "bg-primary/40" : "bg-muted"
            )}
          />
        );
      })}
    </div>
  );
}