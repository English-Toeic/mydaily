import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** 0 – 100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
  /** Có label thì ring được đọc như progressbar, không có thì chỉ để trang trí */
  label?: string;
  children?: ReactNode;
};

export function ProgressRing({
  value,
  size = 44,
  strokeWidth = 3.5,
  className,
  trackClassName,
  indicatorClassName,
  label,
  children,
}: Props) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const a11y = label
    ? {
        role: "progressbar" as const,
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": Math.round(clamped),
      }
    : { "aria-hidden": true };

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...a11y}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-muted", trackClassName)}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className={cn(
            "stroke-primary transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none",
            clamped === 0 && "opacity-0",
            indicatorClassName
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}