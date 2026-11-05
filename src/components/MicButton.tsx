import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { keepInputFocus } from "@/lib/keepInputFocus";
import { cn } from "@/lib/utils";

interface Props {
  listening: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function MicButton({ listening, disabled, onClick }: Props) {
  return (
    <Button
      variant={listening ? "destructive" : "outline"}
      {...keepInputFocus}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Dừng nghe" : "Nói để nhập"}
      title={listening ? "Dừng nghe" : "Nói để nhập"}
      className={cn("h-12 rounded-xl px-4 touch-manipulation", listening && "animate-pulse")}
    >
      {listening ? <Square className="size-4 fill-current" /> : <Mic className="size-4" />}
    </Button>
  );
}