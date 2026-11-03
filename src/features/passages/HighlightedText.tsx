import type { TextSegment } from "@/lib/passage-highlight";

export function HighlightedText({ segments }: { segments: TextSegment[] }) {
  return (
    <span>
      {segments.map((s, i) =>
        s.word ? (
          <mark
            key={i}
            title={`${s.word.english}: ${s.word.meaning}`}
            className="rounded bg-amber-200/60 px-0.5 text-inherit dark:bg-amber-500/25"
          >
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </span>
  );
}