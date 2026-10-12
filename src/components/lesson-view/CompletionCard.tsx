import { useEffect, useState } from "react";
import { ArrowLeft, Repeat, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RESET_CONFIRM_TIMEOUT_MS } from "./config";
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

  // Sau vài giây không bấm lần hai thì huỷ trạng thái xác nhận
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), RESET_CONFIRM_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <Card className="space-y-5 p-8 text-center animate-in fade-in zoom-in-95 motion-reduce:animate-none">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
        <Trophy className="h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          {mode === "review" ? "Bạn đã ôn xong bài này!" : "Bạn đã hoàn thành bài này!"}
        </h2>
        <p className="text-muted-foreground">
          Đã thuộc {learnedCount}/{total} câu.
        </p>
      </div>

      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Về danh sách
        </Button>
        <Button variant="secondary" onClick={onReview} autoFocus>
          <Repeat className="mr-1 h-4 w-4" /> Ôn tập
        </Button>
        <Button
          variant={confirming ? "destructive" : "default"}
          onClick={() => (confirming ? onReset() : setConfirming(true))}
          aria-live="polite"
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          {confirming ? "Bấm lần nữa để xoá tiến độ" : "Học lại từ đầu"}
        </Button>
      </div>
    </Card>
  );
}