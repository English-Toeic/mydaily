import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Word } from "@/types/vocab";
import { useWordForm } from "@/hooks/useWordForm";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { hasNumericId } from "@/lib/errors";
import { countChildDecks } from "@/lib/deck-tree";
import type { BulkRow } from "@/lib/bulk-import";
import {
  normalizeText,
  searchWords,
  tokenize,
  type SearchScope,
  type SentenceStatus,
  type WordHit,
} from "@/lib/vocab-search";
import type { VocabAdminViewProps } from "./types";
import { DeckSidebar } from "./DeckSidebar";
import { WordForm } from "./WordForm";
import { BulkImportPanel } from "./BulkImportPanel";
import { WordSearchBar } from "./WordSearchBar";
import { WordList } from "./WordList";

export function VocabAdminView({
  decks,
  onBack,
  addDeck,
  updateDeck,
  deleteDeck,
  addWord,
  updateWord,
  deleteWord,
  addWordsBulk,
}: VocabAdminViewProps) {
  const { pending, run } = useAsyncAction();
  const form = useWordForm();

  // ---- deck đang chọn (tự fallback về deck đầu tiên khi decks load xong) ----
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const selectedDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) ?? decks[0] ?? null,
    [decks, selectedDeckId]
  );

  const [bulkOpen, setBulkOpen] = useState(false);

  // ---- tìm kiếm ----
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("deck");
  const [status, setStatus] = useState<SentenceStatus>("all");
  const deferredQuery = useDeferredValue(query);
  const tokens = useMemo(() => tokenize(deferredQuery), [deferredQuery]);

  const decksInScope = useMemo(
    () => (scope === "all" ? decks : selectedDeck ? [selectedDeck] : []),
    [scope, decks, selectedDeck]
  );
  const hits = useMemo(
    () => searchWords(decksInScope, tokens, status),
    [decksInScope, tokens, status]
  );
  const totalInScope = useMemo(
    () => decksInScope.reduce((sum, d) => sum + d.words.length, 0),
    [decksInScope]
  );

  // Phím tắt: "/" hoặc Ctrl/Cmd + K để focus ô tìm kiếm
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target;
      const typing =
        t instanceof HTMLElement &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable);
      const isSlash = e.key === "/" && !typing;
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (isSlash || isCmdK) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ======================= DECK HANDLERS =======================

  const handleSelectDeck = (id: number) => {
    if (id === selectedDeck?.id) return;
    setSelectedDeckId(id);
    form.reset();
    setBulkOpen(false);
  };

  const handleAddDeck = async (name: string, parentId: number | null) => {
    const res = await run("add-deck", () => addDeck(name, parentId), "Lỗi thêm deck");
    if (res.ok && hasNumericId(res.value)) handleSelectDeck(res.value.id);
    return res.ok;
  };

  const handleRenameDeck = async (id: number, name: string) => {
    const res = await run("rename-deck", () => updateDeck(id, name), "Lỗi đổi tên");
    return res.ok;
  };

  const handleDeleteDeck = async () => {
    if (!selectedDeck) return;
    const children = countChildDecks(decks, selectedDeck.id);
    const message =
      `Xóa deck "${selectedDeck.name}" và toàn bộ ${selectedDeck.words.length} từ bên trong?` +
      (children > 0 ? `\n⚠️ Deck này có ${children} deck con.` : "");
    if (!confirm(message)) return;

    const deletedId = selectedDeck.id;
    const res = await run("delete-deck", () => deleteDeck(deletedId), "Lỗi xóa deck");
    if (res.ok) {
      const next = decks.find((d) => d.id !== deletedId && d.parent_id !== deletedId);
      setSelectedDeckId(next?.id ?? null);
      form.reset();
    }
  };

  // ======================= WORD HANDLERS =======================

  const handleSaveWord = async () => {
    if (!selectedDeck) return;
    const result = form.build();
    if (!result.ok) {
      alert(result.error);
      return;
    }
    const { fields } = result;
    const editing = form.editingWord;

    if (!editing) {
      const key = normalizeText(fields.english);
      const duplicated = selectedDeck.words.some((w) => normalizeText(w.english) === key);
      if (duplicated && !confirm(`"${fields.english}" đã có trong deck. Vẫn thêm?`)) return;
    }

    const deckId = selectedDeck.id;
    const res = await run(
      "save-word",
      async () => {
        if (editing) await updateWord(editing, fields);
        else await addWord(deckId, fields.english, fields.meaning, fields.ipa, fields.sentences);
      },
      "Lỗi lưu từ"
    );
    if (res.ok) form.reset();
  };

  const handleEditWord = (hit: WordHit) => {
    if (hit.deck.id !== selectedDeck?.id) setSelectedDeckId(hit.deck.id);
    form.loadWord(hit.word);
    setBulkOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteWord = async (word: Word) => {
    if (!confirm(`Xóa từ "${word.english}"?`)) return;
    const res = await run("delete-word", () => deleteWord(word), "Lỗi xóa từ");
    if (res.ok && form.editingWord?.id === word.id) form.reset();
  };

  const handleBulkImport = async (rows: BulkRow[]) => {
    if (!selectedDeck) return false;
    const deckId = selectedDeck.id;
    const res = await run("bulk", () => addWordsBulk(deckId, rows), "Lỗi nhập hàng loạt");
    if (res.ok) setBulkOpen(false);
    return res.ok;
  };

  // ======================= RENDER =======================

  const isSearching = tokens.length > 0 || status !== "all";
  const emptyMessage = isSearching
    ? "Không tìm thấy từ phù hợp"
    : "Chưa có từ nào";

  return (
    <div className="max-w-5xl mx-auto p-4">
      <header className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Quản lý từ vựng</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        <DeckSidebar
          decks={decks}
          selectedId={selectedDeck?.id ?? null}
          busy={pending === "add-deck" || pending === "rename-deck"}
          onSelect={handleSelectDeck}
          onAdd={handleAddDeck}
          onRename={handleRenameDeck}
        />

        <main className="border rounded-xl p-4 min-w-0">
          {!selectedDeck ? (
            <div className="text-center text-muted-foreground py-20 text-sm">
              Chọn hoặc tạo một deck để bắt đầu
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="font-semibold truncate">
                  {selectedDeck.name}
                  <span className="text-muted-foreground font-normal">
                    {" "}· {selectedDeck.words.length} từ
                  </span>
                </h2>
                <Button size="sm" variant="outline" onClick={() => setBulkOpen((v) => !v)}>
                  <Upload className="h-4 w-4 mr-1" />
                  Nhập hàng loạt
                </Button>
              </div>

              <WordForm form={form} saving={pending === "save-word"} onSubmit={() => void handleSaveWord()} />

              {bulkOpen && (
                <BulkImportPanel
                  existingWords={selectedDeck.words}
                  busy={pending === "bulk"}
                  onImport={handleBulkImport}
                  onClose={() => setBulkOpen(false)}
                />
              )}

              <WordSearchBar
                inputRef={searchRef}
                query={query}
                scope={scope}
                status={status}
                shown={hits.length}
                total={totalInScope}
                onQueryChange={setQuery}
                onScopeChange={setScope}
                onStatusChange={setStatus}
              />

              <WordList
                hits={hits}
                tokens={tokens}
                showDeckName={scope === "all"}
                editingId={form.editingWord?.id ?? null}
                emptyMessage={emptyMessage}
                onEdit={handleEditWord}
                onDelete={(w) => void handleDeleteWord(w)}
              />

              <div className="pt-4 mt-4 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={pending === "delete-deck"}
                  onClick={() => void handleDeleteDeck()}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa deck này
                </Button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}