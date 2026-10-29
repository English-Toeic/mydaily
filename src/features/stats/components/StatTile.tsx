// components/StatTile.tsx
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  tone: string;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}

export function StatTile({ icon: Icon, tone, label, value, sub }: Props) {
  return (
    <Card className="p-4">
      <div className={cn("mb-2 flex items-center gap-1.5 text-xs font-medium", tone)}>
        <Icon className="size-4" />
        {label}
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <div className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}