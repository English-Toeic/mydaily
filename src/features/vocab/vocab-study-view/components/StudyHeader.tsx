import { ArrowLeft, MessageSquareOff, MessageSquareText, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { keepInputFocus } from "@/lib/keepInputFocus";

interface Props {
  title: string;
  remaining: number;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  practiceOn: boolean;
  onTogglePractice: () => void;
  onBack: () => void;
}

export function StudyHeader({
  title, remaining, autoSpeak, onToggleAutoSpeak, practiceOn, onTogglePractice, onBack,
}: Props) {
  return (
    <header className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        aria-label="Quay lại"
        className="shrink-0 rounded-full"
      >
        <ArrowLeft className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-semibold leading-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">Còn {remaining} từ</p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        {...keepInputFocus}
        onClick={onToggleAutoSpeak}
        aria-pressed={autoSpeak}
        aria-label={autoSpeak ? "Tắt tự đọc" : "Bật tự đọc"}
        title={autoSpeak ? "Tự đọc: bật" : "Tự đọc: tắt"}
        className="shrink-0 rounded-full text-muted-foreground"
      >
        {autoSpeak ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        {...keepInputFocus}
        onClick={onTogglePractice}
        aria-pressed={practiceOn}
        aria-label={practiceOn ? "Tắt luyện câu" : "Bật luyện câu"}
        title={practiceOn ? "Luyện câu: đang bật (bấm để tắt)" : "Luyện câu: đang tắt (bấm để bật)"}
        className={cn(
          "shrink-0 rounded-full transition-colors",
          practiceOn
            ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            : "text-muted-foreground/60 hover:text-muted-foreground"
        )}
      >
        {practiceOn ? <MessageSquareText className="size-5" /> : <MessageSquareOff className="size-5" />}
      </Button>
    </header>
  );
}