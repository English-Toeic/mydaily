// components/SentenceCard.tsx
import { makeHint } from "@/lib/sentences";
import type { Word } from "@/types/vocab";
import type { Sentence } from "../hooks/usePracticeSession";

interface Props {
  word: Word;
  sentence: Sentence;
  showHint: boolean;
}

export function SentenceCard({ word, sentence, showHint }: Props) {
  return (
    <section className="relative rounded-3xl border bg-linear-to-b from-primary/[0.07] via-card to-card px-6 pb-8 pt-12 text-center shadow-sm">
      <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
        <span lang="en" className="font-semibold">{word.english}</span> · {word.meaning}
      </span>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Dịch câu này sang tiếng Anh
      </p>
      <p lang="vi" className="mt-3 wrap-break-word text-2xl font-semibold leading-snug">
        {sentence.vi}
      </p>
      {showHint && (
        <p lang="en" aria-label="Gợi ý" className="mt-5 font-mono text-base tracking-wide text-primary">
          {makeHint(sentence.en[0])}
        </p>
      )}
    </section>
  );
}