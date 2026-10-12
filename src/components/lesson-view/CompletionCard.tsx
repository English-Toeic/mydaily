import { useEffect, useState } from "react";
import { ArrowLeft, Repeat, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RESET_CONFIRM_TIMEOUT_MS } from "./config";
import { toPercent } from "./utils";
import type { SessionMode } from "./types";

type Props = {
  mode: SessionMode;
  learnedCount: number;
  total: number;
  onBack: () => void;
  onReview: () => void;
  onReset: () => void;
};

export function CompletionCard({ mode, learnedCount, total, onBack, onReview, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);
  const percent = toPercent(learnedCount, total);
  const remaining = Math.max(0, total - learnedCount);

  // Sau vài giây không bấm lần hai thì huỷ trạng thái xác nhận
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), RESET_CONFIRM_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <Card className="pt-0 animate-in fade-in zoom-in-95 motion-reduce:animate-none">
      {/* Banner */}
      <div className="relative overflow-hidden bg-linear-to-br from-emerald-500/15 via-primary/10 to-violet-500/10 px-6 pt-10 pb-8 text-center">
        <div aria-hidden className="pointer-events-none absolute -top-10 -left-10 size-40 rounded-full bg-emerald-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative mx-auto grid size-20 place-items-center rounded-full bg-background shadow-lg ring-4 ring-emerald-500/20 animate-in zoom-in-50 duration-500 motion-reduce:animate-none">
          <Trophy className="size-9 text-amber-500" />
        </div>
        <h2 className="relative mt-5 text-2xl font-bold tracking-tight">
          {mode === "review" ? "Ôn tập xong rồi!" : "Hoàn thành bài học!"}
        </h2>
        <p className="relative mt-1 text-sm text-muted-foreground">
          {mode === "review"
            ? "Bạn đã nghe lại toàn bộ các câu trong bài."
            : "Bạn đã chép chính tả đúng tất cả các câu. Tuyệt vời!"}
        </p>
      </div>

      <CardContent className="space-y-6">
        {/* Thống kê */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Đã thuộc" value={learnedCount} className="text-emerald-600 dark:text-emerald-400" />
          <Stat label="Chưa thuộc" value={remaining} className={remaining ? "text-amber-600 dark:text-amber-400" : undefined} />
          <Stat label="Tiến độ" value={`${percent}%`} />
        </div>

        {/* Hành động */}
        <div className="space-y-2">
          <Button size="lg" onClick={onReview} autoFocus className="h-12 w-full rounded-xl text-base">
            <Repeat className="mr-1 size-4" /> Ôn tập lại
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onBack} className="rounded-xl">
              <ArrowLeft className="mr-1 size-4" /> Về danh sách
            </Button>
            <Button
              variant={confirming ? "destructive" : "outline"}
              onClick={() => (confirming ? onReset() : setConfirming(true))}
              aria-live="polite"
              className={cn("rounded-xl", !confirming && "text-muted-foreground")}
            >
              <RotateCcw className="mr-1 size-4" />
              {confirming ? "Bấm lần nữa để xoá" : "Học lại từ đầu"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, className }: { label: string; value: number | string; className?: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-3 text-center">
      <p className={cn("text-2xl font-bold tabular-nums", className)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}