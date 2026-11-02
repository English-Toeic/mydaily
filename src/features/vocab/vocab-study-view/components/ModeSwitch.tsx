import { cn } from "@/lib/utils";
import { keepInputFocus } from "@/lib/keepInputFocus";
import type { StudyMode } from "../../useStudySession";

const MODE_OPTIONS: { value: StudyMode; label: string }[] = [
  { value: "vi-en", label: "Việt → Anh" },
  { value: "en-vi", label: "Anh → Việt" },
  { value: "mixed", label: "Trộn" },
];

interface Props {
  value: StudyMode;
  onChange: (m: StudyMode) => void;
}

/** Nhóm nút aria-pressed: đúng ngữ nghĩa mà không cần tự cài điều hướng phím mũi tên như radiogroup */
export function ModeSwitch({ value, onChange }: Props) {
  return (
    <div role="group" aria-label="Chiều học" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
      {MODE_OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            {...keepInputFocus}
            onClick={() => !active && onChange(o.value)}
            className={cn(
              "rounded-lg px-2 py-1.5 text-sm font-medium transition-all touch-manipulation",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}