// src/hooks/useVocab.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Deck, Sentence, Word, WordFields, WordStatus } from "@/types/vocab";
import { enqueue, listOps, syncOutbox, withOutboxLock, type OutboxItem } from "@/lib/offline/outbox";
import { readCache, usePersistedCache } from "@/lib/offline/cache";

const LEARNED_THRESHOLD = 3; // đúng 3 lần liên tiếp → learned
const CACHE_KEY = "decks";

type DeckRow = Omit<Deck, "words">;

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") return err.message;
  if (typeof err === "string") return err;
  return "Lỗi không xác định";
}

function applyPending(decks: Deck[], items: OutboxItem[]): Deck[] {
  const grades = new Map<number, { status: WordStatus; correct_count: number }>();
  for (const { op } of items) if (op.type === "word.grade") grades.set(op.wordId, op);
  if (!grades.size) return decks;
  return decks.map((d) => ({
    ...d,
    words: d.words.map((w) => {
      const g = grades.get(w.id);
      return g ? { ...w, status: g.status, correct_count: g.correct_count } : w;
    }),
  }));
}


export function useVocab() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false); 

  usePersistedCache(CACHE_KEY, decks, hydrated);

  const fetchAll = useCallback(async () => {
    setError(null);

    const [cached, queued] = await Promise.all([readCache<Deck[]>(CACHE_KEY), listOps()]);
    if (cached) {
      setDecks(applyPending(cached, queued));
      setHydrated(true);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      if (!navigator.onLine) throw new Error("Đang offline và chưa có dữ liệu lưu sẵn.");
      await syncOutbox();
      
      const { deckRows, wordRows, pending } = await withOutboxLock(async () => {
        const [d, w] = await Promise.all([
          supabase.from("decks").select("*").order("id"),
          supabase.from("words").select("*").order("id"),
        ]);
        if (d.error) throw d.error;
        if (w.error) throw w.error;
        return { deckRows: d.data ?? [], wordRows: w.data ?? [], pending: await listOps() };
      });

      const words = wordRows.map((w) => ({
        ...w,
        sentences: Array.isArray(w.sentences) ? w.sentences : [],
      })) as Word[];
      const decksData: Deck[] = (deckRows as DeckRow[]).map((d) => ({
        ...d,
        words: words.filter((w) => w.deck_id === d.id),
      }));

      setDecks(applyPending(decksData, pending));
      setHydrated(true);
    } catch (err: unknown) {
      if (!cached) setError(getErrorMessage(err));
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

      await enqueue({ type: "word.grade", wordId: word.id, status, correct_count });

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
  // const addWord = useCallback(
  //   async (deck_id: number, english: string, meaning: string, ipa: string | null) => {
  //     const { data, error } = await supabase
  //       .from("words")
  //       .insert({ deck_id, english, meaning, ipa, status: "new", correct_count: 0 })
  //       .select()
  //       .single();
  //     if (error) throw error;
      
  //     const newWord = data as Word;
  //     setDecks((prev) =>
  //       prev.map((d) =>
  //         d.id === deck_id ? { ...d, words: [...d.words, newWord] } : d
  //       )
  //     );
  //     return newWord;
  //   },
  //   []
  // );

  // const updateWord = useCallback(
  //   async (
  //     word: Word,
  //     fields: { english: string; meaning: string; ipa: string | null }
  //   ) => {
  //     const { error } = await supabase
  //       .from("words")
  //       .update(fields)
  //       .eq("id", word.id);
  //     if (error) throw error;
  //     setDecks((prev) =>
  //       prev.map((d) =>
  //         d.id !== word.deck_id
  //           ? d
  //           : {
  //               ...d,
  //               words: d.words.map((w) =>
  //                 w.id === word.id ? { ...w, ...fields } : w
  //               ),
  //             }
  //       )
  //     );
  //   },
  //   []
  // );

  const addWord = useCallback(
    async (
      deck_id: number,
      english: string,
      meaning: string,
      ipa: string | null,
      sentences: Sentence[] = []
    ) => {
      const { data, error } = await supabase
        .from("words")
        .insert({
          deck_id,
          english,
          meaning,
          ipa,
          sentences,
          status: "new",
          correct_count: 0,
        })
        .select()
        .single();
      if (error) throw error;

      const newWord = { ...(data as Word), sentences: data.sentences ?? [] };
      setDecks((prev) =>
        prev.map((d) =>
          d.id === deck_id ? { ...d, words: [...d.words, newWord] } : d
        )
      );
      return newWord;
    },
    []
  );

  const updateWord = useCallback(async (word: Word, fields: WordFields) => {
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
  }, []);

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
        sentences: [],
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

  const MOVE_CHUNK = 200; // tránh URL quá dài khi .in() với nhiều id

  // ---- MOVE: chuyển nhiều từ sang deck khác ----
  const moveWords = useCallback(
    async (wordIds: number[], targetDeckId: number): Promise<number> => {
      const ids = [...new Set(wordIds)];
      if (ids.length === 0) return 0;
      const moved: number[] = [];
      try {
        for (let i = 0; i < ids.length; i += MOVE_CHUNK) {
          const chunk = ids.slice(i, i + MOVE_CHUNK);
          const { error } = await supabase
            .from("words")
            .update({ deck_id: targetDeckId })
            .in("id", chunk);
          if (error) throw error;
          moved.push(...chunk);
        }
      } finally {
        // Lỗi giữa chừng: các đợt trước đã vào DB, vẫn phải đồng bộ local
        if (moved.length > 0) {
          const idSet = new Set(moved);
          setDecks((prev) => {
            const movedWords: Word[] = [];
            const stripped = prev.map((d) => {
              if (!d.words.some((w) => idSet.has(w.id))) return d;
              return {
                ...d,
                words: d.words.filter((w) => {
                  if (!idSet.has(w.id)) return true;
                  movedWords.push({ ...w, deck_id: targetDeckId });
                  return false;
                }),
              };
            });
            return stripped.map((d) =>
              d.id === targetDeckId
                ? { ...d, words: [...d.words, ...movedWords].sort((a, b) => a.id - b.id) }
                : d
            );
          });
        }
      }
      return moved.length;
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
    moveWords
  };
}