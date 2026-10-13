import type { BulkRow } from "@/lib/bulk-import";
import type { Deck, Sentence, Word, WordFields } from "@/types/vocab";

export interface VocabAdminActions {
  /** Nếu trả về object có `id`, deck mới sẽ được chọn tự động. */
  addDeck: (name: string, parent_id: number | null) => Promise<unknown>;
  updateDeck: (id: number, name: string) => Promise<void>;
  deleteDeck: (id: number) => Promise<void>;
  addWord: (
    deck_id: number,
    english: string,
    meaning: string,
    ipa: string | null,
    sentences: Sentence[]
  ) => Promise<unknown>;
  updateWord: (word: Word, fields: WordFields) => Promise<void>;
  deleteWord: (word: Word) => Promise<void>;
  addWordsBulk: (deck_id: number, rows: BulkRow[]) => Promise<unknown>;
}

export interface VocabAdminViewProps extends VocabAdminActions {
  decks: Deck[];
  onBack: () => void;
}