// src/components/StatsView.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { todayKey } from "@/lib/storage";
import { ArrowLeft, Flame, Clock, CalendarDays } from "lucide-react";
import type { StudyState } from "@/types";

interface Props {
  study: StudyState;
  onBack: () => void;
}

export function StatsView({ study, onBack }: Props) {
  const today = todayKey();
  const todaySeconds = study.daily[today] ?? 0;

  // 7 ngày gần nhất
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString("vi-VN", { weekday: "short" }), seconds: study.daily[key] ?? 0 };
  });
  const maxSec = Math.max(...last7.map((d) => d.seconds), 1);
  const totalSec = Object.values(study.daily).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold">Thống kê học tập</h2>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2 text-orange-500">
            <Flame className="h-5 w-5" />
            <span className="text-sm font-medium">Chuỗi ngày</span>
          </div>
          <p className="text-3xl font-bold">{study.streak}</p>
          <p className="text-xs text-muted-foreground">ngày liên tục</p>
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2 text-blue-500">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Hôm nay</span>
          </div>
          <p className="text-3xl font-bold">{formatDuration(todaySeconds)}</p>
          <p className="text-xs text-muted-foreground">thời gian học</p>
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2 text-emerald-500">
            <CalendarDays className="h-5 w-5" />
            <span className="text-sm font-medium">Tổng cộng</span>
          </div>
          <p className="text-3xl font-bold">{formatDuration(totalSec)}</p>
          <p className="text-xs text-muted-foreground">toàn thời gian</p>
        </Card>
      </div>

      {/* Biểu đồ 7 ngày */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold">7 ngày gần nhất</h3>
        <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
          {last7.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-primary/80 transition-all"
                  style={{ height: `${(d.seconds / maxSec) * 100}%`, minHeight: d.seconds > 0 ? 4 : 0 }}
                  title={formatDuration(d.seconds)}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}