import { useCallback, useMemo, useState } from "react";
import type { Word, WordFields } from "@/types/vocab";
import {
  emptyDrafts,
  parseDrafts,
  toDrafts,
  type SentenceDraft,
} from "@/lib/sentences";

export type BuildResult =
  | { ok: true; fields: WordFields }
  | { ok: false; error: string };

export function useWordForm() {
  const [english, setEnglish] = useState("");
  const [meaning, setMeaning] = useState("");
  const [ipa, setIpa] = useState("");
  const [drafts, setDrafts] = useState<SentenceDraft[]>(emptyDrafts);
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  const filledCount = useMemo(
    () => drafts.filter((d) => d.vi.trim() && d.en.trim()).length,
    [drafts]
  );

  const canSubmit = english.trim() !== "" && meaning.trim() !== "";

  const updateDraft = useCallback(
    (index: number, key: keyof SentenceDraft, value: string) => {
      setDrafts((prev) =>
        prev.map((d, i) => (i === index ? { ...d, [key]: value } : d))
      );
    },
    []
  );

  const reset = useCallback(() => {
    setEnglish("");
    setMeaning("");
    setIpa("");
    setDrafts(emptyDrafts());
    setEditingWord(null);
  }, []);

  const loadWord = useCallback((word: Word) => {
    setEditingWord(word);
    setEnglish(word.english);
    setMeaning(word.meaning);
    setIpa(word.ipa ?? "");
    setDrafts(toDrafts(word.sentences ?? []));
  }, []);

  const build = (): BuildResult => {
    if (!canSubmit) {
      return { ok: false, error: "Vui lòng nhập English và nghĩa tiếng Việt" };
    }
    const { sentences, error } = parseDrafts(drafts);
    if (error) return { ok: false, error };

    return {
      ok: true,
      fields: {
        english: english.trim(),
        meaning: meaning.trim(),
        ipa: ipa.trim() || null,
        sentences,
      },
    };
  };

  return {
    english,
    meaning,
    ipa,
    drafts,
    editingWord,
    filledCount,
    canSubmit,
    setEnglish,
    setMeaning,
    setIpa,
    setDrafts,
    updateDraft,
    reset,
    loadWord,
    build,
  };
}

export type WordFormState = ReturnType<typeof useWordForm>;