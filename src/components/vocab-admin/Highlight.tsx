import { findMatchRanges } from "@/lib/vocab-search";
import { Fragment, useMemo } from "react";

interface HighlightProps {
  text: string;
  tokens: string[];
}

export function Highlight({ text, tokens }: HighlightProps) {
  const ranges = useMemo(() => findMatchRanges(text, tokens), [text, tokens]);
  if (ranges.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) {
      parts.push(<Fragment key={`t${i}`}>{text.slice(cursor, start)}</Fragment>);
    }
    parts.push(
      <mark
        key={`m${i}`}
        className="bg-reward/40 text-inherit rounded-sm px-0.5 -mx-0.5"
      >
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(<Fragment key="rest">{text.slice(cursor)}</Fragment>);

  return <>{parts}</>;
}