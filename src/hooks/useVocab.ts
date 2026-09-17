// src/hooks/useVocab.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Deck, Word, WordStatus } from "@/types/vocab";

const LEARNED_THRESHOLD = 3; // đúng 3 lần liên tiếp → learned

type DeckRow = Omit<Deck, "words">;

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Lỗi không xác định";
}

export function useVocab() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: deckRows, error: e1 }, { data: wordRows, error: e2 }] =
        await Promise.all([
          supabase.from("decks").select("*").order("id"),
          supabase.from("words").select("*").order("id"),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;

      const words = (wordRows ?? []) as Word[];
      const decksData: Deck[] = (deckRows ?? []).map((d) => ({
        ...d,
        words: words.filter((w) => w.deck_id === d.id),
      }));
      setDecks(decksData);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /** Cập nhật kết quả 1 từ sau khi trả lời */
   const gradeWord = useCallback(
    async (word: Word, correct: boolean): Promise<Word> => {
      const correct_count = correct ? word.correct_count + 1 : 0;
      const status: WordStatus =
        correct_count >= LEARNED_THRESHOLD ? "learned" : "learning";

      // update local ngay (optimistic)
      setDecks((prev) =>
        prev.map((d) =>
          d.id !== word.deck_id
            ? d
            : {
                ...d,
                words: d.words.map((w) =>
                  w.id === word.id ? { ...w, status, correct_count } : w
                ),
              }
        )
      );

      const { error } = await supabase
        .from("words")
        .update({ status, correct_count })
        .eq("id", word.id);
      if (error) console.error(error);

      return { ...word, status, correct_count };
    },
    []
  );

  // ---- DECK ----
  const addDeck = useCallback(
    async (name: string, parent_id: number | null) => {
      const { data, error } = await supabase
        .from("decks")
        .insert({ name, parent_id })
        .select()
        .single();
      if (error) throw error;
      
      const row = data as DeckRow;
      const newDeck: Deck = { ...row, words: [] };
      setDecks((prev) => [...prev, newDeck]);
      return newDeck;
    },
    []
  );

  const updateDeck = useCallback(
    async (id: number, name: string) => {
      const { error } = await supabase
        .from("decks")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
      setDecks((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name } : d))
      );
    },
    []
  );

  const deleteDeck = useCallback(async (id: number) => {
    const { error } = await supabase.from("decks").delete().eq("id", id);
    if (error) throw error;
    // xóa deck + deck con (cascade ở DB, ở local xóa những deck có parent_id = id)
    setDecks((prev) =>
      prev.filter((d) => d.id !== id && d.parent_id !== id)
    );
  }, []);

  // ---- WORD ----
  const addWord = useCallback(
    async (deck_id: number, english: string, meaning: string, ipa: string | null) => {
      const { data, error } = await supabase
        .from("words")
        .insert({ deck_id, english, meaning, ipa, status: "new", correct_count: 0 })
        .select()
        .single();
      if (error) throw error;
      
      const newWord = data as Word;
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deck_id ? { ...d, words: [...d.words, newWord] } : d
        )
      );
      return newWord;
    },
    []
  );

  const updateWord = useCallback(
    async (
      word: Word,
      fields: { english: string; meaning: string; ipa: string | null }
    ) => {
      const { error } = await supabase
        .from("words")
        .update(fields)
        .eq("id", word.id);
      if (error) throw error;
      setDecks((prev) =>
        prev.map((d) =>
          d.id !== word.deck_id
            ? d
            : {
                ...d,
                words: d.words.map((w) =>
                  w.id === word.id ? { ...w, ...fields } : w
                ),
              }
        )
      );
    },
    []
  );

  const deleteWord = useCallback(async (word: Word) => {
    const { error } = await supabase.from("words").delete().eq("id", word.id);
    if (error) throw error;
    setDecks((prev) =>
      prev.map((d) =>
        d.id !== word.deck_id
          ? d
          : { ...d, words: d.words.filter((w) => w.id !== word.id) }
      )
    );
  }, []);

  // ---- BULK: nhập nhiều từ 1 lúc ----
  const addWordsBulk = useCallback(
    async (
      deck_id: number,
      rows: { english: string; meaning: string; ipa: string | null }[]
    ) => {
      const payload = rows.map((r) => ({
        deck_id,
        english: r.english,
        meaning: r.meaning,
        ipa: r.ipa,
        status: "new" as const,
        correct_count: 0,
      }));
      const { data, error } = await supabase.from("words").insert(payload).select();
      if (error) throw error;
      
      const newWords = (data ?? []) as Word[];
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deck_id ? { ...d, words: [...d.words, ...newWords] } : d
        )
      );
      return newWords;
    },
    []
  );

   return {
    decks,
    loading,
    error,
    refetch: fetchAll,
    gradeWord,
    // CRUD
    addDeck,
    updateDeck,
    deleteDeck,
    addWord,
    updateWord,
    deleteWord,
    addWordsBulk,
  };
}