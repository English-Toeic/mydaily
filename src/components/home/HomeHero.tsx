import { ArrowRight, BookMarked, Flame, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  streak: number;
  sectionCount: number;
  lessonCount: number;
  onOpenVocab: () => void;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 14) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function HomeHero({ streak, sectionCount, lessonCount, onOpenVocab }: Props) {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl border bg-linear-to-br from-primary/10 via-background to-background p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {greeting()}, developer 👋
        </span>

        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl">
          Học tiếng Anh cho{" "}
          <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Developer
          </span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Luyện nghe và gõ lại những câu tiếng Anh dùng thật trong code review, standup và tài liệu kỹ thuật.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Stat icon={<Flame className="h-4 w-4 text-orange-500" />} value={streak} label="ngày liên tiếp" />
          <Stat icon={<Layers className="h-4 w-4 text-primary" />} value={sectionCount} label="chủ đề" />
          <Stat icon={<BookMarked className="h-4 w-4 text-emerald-500" />} value={lessonCount} label="bài học" />

          <Button onClick={onOpenVocab} variant="outline" size="sm" className="group ml-auto rounded-full">
            Ôn từ vựng
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-background/70 px-3 py-2 backdrop-blur">
      {icon}
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}