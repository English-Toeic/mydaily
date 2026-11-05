import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { keepInputFocus } from "@/lib/keepInputFocus";
import { cn } from "@/lib/utils";

interface Props {
  listening: boolean;
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}

export function MicButton({ listening, disabled, className, onClick }: Props) {
  const label = listening ? "Dừng nghe" : "Nói để nhập";

  return (
    <Button
      {...keepInputFocus}
      type="button"
      size="icon"
      variant={listening ? "destructive" : "outline"}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      aria-pressed={listening}
      title={label}
      className={cn(
        "shrink-0",
        listening && "animate-pulse motion-reduce:animate-none",
        className
      )}
    >
      {listening ? <Square className="size-4 fill-current" /> : <Mic className="size-5" />}
    </Button>
  );
}