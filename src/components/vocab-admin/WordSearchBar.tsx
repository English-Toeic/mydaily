import type { Ref } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchScope, SentenceStatus } from "@/lib/vocab-search";
import { inputCls } from "./styles";

interface WordSearchBarProps {
  inputRef: Ref<HTMLInputElement>;
  query: string;
  scope: SearchScope;
  status: SentenceStatus;
  shown: number;
  total: number;
  onQueryChange: (q: string) => void;
  onScopeChange: (s: SearchScope) => void;
  onStatusChange: (s: SentenceStatus) => void;
}

const STATUS_OPTIONS: { value: SentenceStatus; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "missing", label: "Thiếu câu" },
  { value: "complete", label: "Đủ câu" },
];

const SCOPE_OPTIONS: { value: SearchScope; label: string }[] = [
  { value: "deck", label: "Deck này" },
  { value: "all", label: "Mọi deck" },
];

export function WordSearchBar({
  inputRef,
  query,
  scope,
  status,
  shown,
  total,
  onQueryChange,
  onScopeChange,
  onStatusChange,
}: WordSearchBarProps) {
  const isFiltering = query.trim() !== "" || status !== "all";

  return (
    <div className="space-y-2 mb-2">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onQueryChange("");
          }}
          placeholder="Tìm từ, nghĩa, IPA hoặc câu ví dụ…  (nhấn / để tìm)"
          className={cn(inputCls, "w-full pl-8 pr-8 py-2")}
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <SegmentedControl options={SCOPE_OPTIONS} value={scope} onChange={onScopeChange} />
        <SegmentedControl options={STATUS_OPTIONS} value={status} onChange={onStatusChange} />
        {isFiltering && (
          <span className="text-muted-foreground ml-auto">
            {shown}/{total} từ
          </span>
        )}
      </div>
    </div>
  );
}

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex rounded-md border p-0.5 bg-muted/40">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2 py-1 rounded",
            value === o.value
              ? "bg-background shadow-sm font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}