import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  FolderPlus,
  Check,
  X,
  Upload,
  ClipboardPaste,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Deck, Sentence, Word, WordFields } from "@/types/vocab";
import {
  SENTENCE_COUNT,
  emptyDrafts,
  parseDrafts,
  parsePaste,
  toDrafts,
  type SentenceDraft,
} from "@/lib/sentences";

interface Props {
  decks: Deck[];
  onBack: () => void;
  addDeck: (name: string, parent_id: number | null) => Promise<any>;
  updateDeck: (id: number, name: string) => Promise<void>;
  deleteDeck: (id: number) => Promise<void>;
  addWord: (
    deck_id: number,
    english: string,
    meaning: string,
    ipa: string | null,
    sentences: Sentence[]
  ) => Promise<any>;
  updateWord: (word: Word, fields: WordFields) => Promise<void>;
  deleteWord: (word: Word) => Promise<void>;
  addWordsBulk: (
    deck_id: number,
    rows: { english: string; meaning: string; ipa: string | null }[]
  ) => Promise<any>;
}

const inputCls =
  "px-2 py-1.5 rounded-md border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/40";

export function VocabAdminView(props: Props) {
  const {
    decks,
    onBack,
    addDeck,
    updateDeck,
    deleteDeck,
    addWord,
    updateWord,
    deleteWord,
    addWordsBulk,
  } = props;

  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(
    decks[0]?.id ?? null
  );

  const selectedDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) ?? null,
    [decks, selectedDeckId]
  );

  // ---- deck form ----
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckParent, setNewDeckParent] = useState<number | null>(null);

  // ---- deck rename ----
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // ---- word form ----
  const [eng, setEng] = useState("");
  const [mean, setMean] = useState("");
  const [ipa, setIpa] = useState("");
  const [editingWordId, setEditingWordId] = useState<number | null>(null);

  // ---- sentences ----
  const [drafts, setDrafts] = useState<SentenceDraft[]>(emptyDrafts);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // ---- bulk ----
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const filledCount = drafts.filter((d) => d.vi.trim() && d.en.trim()).length;

  const updateDraft = (i: number, key: keyof SentenceDraft, value: string) => {
    setDrafts((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, [key]: value } : d))
    );
  };

  const resetWordForm = () => {
    setEng("");
    setMean("");
    setIpa("");
    setEditingWordId(null);
    setDrafts(emptyDrafts());
    setPasteOpen(false);
    setPasteText("");
  };

  const handleSaveWord = async () => {
    if (!selectedDeckId || !eng.trim() || !mean.trim()) return;

    const { sentences, error } = parseDrafts(drafts);
    if (error) {
      alert(error);
      return;
    }

    try {
      if (editingWordId) {
        const w = selectedDeck?.words.find((x) => x.id === editingWordId);
        if (w)
          await updateWord(w, {
            english: eng.trim(),
            meaning: mean.trim(),
            ipa: ipa.trim() || null,
            sentences,
          });
      } else {
        await addWord(
          selectedDeckId,
          eng.trim(),
          mean.trim(),
          ipa.trim() || null,
          sentences
        );
      }
      resetWordForm();
    } catch (e: any) {
      alert(e.message ?? "Lỗi lưu từ");
    }
  };

  const startEdit = (w: Word) => {
    setEditingWordId(w.id);
    setEng(w.english);
    setMean(w.meaning);
    setIpa(w.ipa ?? "");
    setDrafts(toDrafts(w.sentences));
    setPasteOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    setDrafts(parsePaste(pasteText));
    setPasteText("");
    setPasteOpen(false);
  };

  const handleAddDeck = async () => {
    if (!newDeckName.trim()) return;
    try {
      const created = await addDeck(newDeckName.trim(), newDeckParent);
      setNewDeckName("");
      setNewDeckParent(null);
      if (created) setSelectedDeckId(created.id);
    } catch (e: any) {
      alert(e.message ?? "Lỗi thêm deck");
    }
  };

  const handleRename = async (id: number) => {
    if (!renameValue.trim()) return;
    try {
      await updateDeck(id, renameValue.trim());
      setRenamingId(null);
      setRenameValue("");
    } catch (e: any) {
      alert(e.message ?? "Lỗi đổi tên");
    }
  };

  const handleBulkImport = async () => {
    if (!selectedDeckId) return;
    const rows = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\t|\|/).map((s) => s.trim());
        return {
          english: parts[0] ?? "",
          meaning: parts[1] ?? "",
          ipa: parts[2] ? parts[2] : null,
        };
      })
      .filter((r) => r.english && r.meaning);

    if (rows.length === 0) {
      alert("Không có dòng hợp lệ. Định dạng: english | meaning | ipa");
      return;
    }
    try {
      await addWordsBulk(selectedDeckId, rows);
      setBulkText("");
      setBulkOpen(false);
    } catch (e: any) {
      alert(e.message ?? "Lỗi nhập hàng loạt");
    }
  };

  const rootDecks = decks.filter((d) => d.parent_id === null);

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* header */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Quản lý từ vựng</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        {/* ================= CỘT TRÁI: DECKS ================= */}
        <div className="border rounded-xl p-3 space-y-3 h-fit">
          <p className="text-sm font-medium text-muted-foreground">Decks</p>

          <div className="space-y-1">
            {decks.map((d) => (
              <div key={d.id} className="flex items-center gap-1">
                {renamingId === d.id ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(d.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className={cn(inputCls, "flex-1 py-1")}
                    />
                    <button
                      onClick={() => handleRename(d.id)}
                      className="text-success p-1"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="text-muted-foreground p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedDeckId(d.id)}
                      className={cn(
                        "flex-1 text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between",
                        selectedDeckId === d.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <span className="truncate">
                        {d.parent_id !== null && "└ "}
                        {d.name}
                      </span>
                      <span className="text-xs opacity-70">
                        {d.words.length}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setRenamingId(d.id);
                        setRenameValue(d.name);
                      }}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {decks.length === 0 && (
              <p className="text-xs text-muted-foreground">Chưa có deck</p>
            )}
          </div>

          {/* form thêm deck */}
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Thêm deck
            </p>
            <input
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Tên deck"
              className={cn(inputCls, "w-full")}
            />
            <select
              value={newDeckParent ?? ""}
              onChange={(e) =>
                setNewDeckParent(e.target.value ? Number(e.target.value) : null)
              }
              className={cn(inputCls, "w-full")}
            >
              <option value="">— Deck gốc —</option>
              {rootDecks.map((d) => (
                <option key={d.id} value={d.id}>
                  Con của: {d.name}
                </option>
              ))}
            </select>
            <Button size="sm" className="w-full" onClick={handleAddDeck}>
              <FolderPlus className="h-4 w-4 mr-1" />
              Thêm deck
            </Button>
          </div>
        </div>

        {/* ================= CỘT PHẢI: WORDS ================= */}
        <div className="border rounded-xl p-4">
          {!selectedDeck ? (
            <div className="text-center text-muted-foreground py-20 text-sm">
              Chọn hoặc tạo một deck để bắt đầu
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">
                  {selectedDeck.name}
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {selectedDeck.words.length} từ
                  </span>
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkOpen((v) => !v)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Nhập hàng loạt
                </Button>
              </div>

              {/* ---------- form thêm / sửa từ ---------- */}
              <div
                className={cn(
                  "space-y-3 mb-4 p-3 rounded-lg bg-muted/40 border",
                  editingWordId ? "border-primary/50" : "border-transparent"
                )}
              >
                {editingWordId && (
                  <p className="text-xs font-medium text-primary">
                    Đang sửa: {eng}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    value={eng}
                    onChange={(e) => setEng(e.target.value)}
                    placeholder="English"
                    className={inputCls}
                  />
                  <input
                    value={mean}
                    onChange={(e) => setMean(e.target.value)}
                    placeholder="Nghĩa tiếng Việt"
                    className={inputCls}
                  />
                  <input
                    value={ipa}
                    onChange={(e) => setIpa(e.target.value)}
                    placeholder="IPA (tùy chọn)"
                    className={inputCls}
                  />
                </div>

                {/* ---------- 5 câu luyện tập ---------- */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Câu luyện tập{" "}
                      <span
                        className={cn(
                          filledCount === SENTENCE_COUNT && "text-success"
                        )}
                      >
                        ({filledCount}/{SENTENCE_COUNT})
                      </span>
                      <span className="font-normal">
                        {" "}
                        · nhiều đáp án cách nhau bằng{" "}
                        <code className="bg-muted px-1 rounded">|</code>
                      </span>
                    </p>
                    <button
                      onClick={() => setPasteOpen((v) => !v)}
                      className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      Dán nhanh
                    </button>
                  </div>

                  {pasteOpen && (
                    <div className="space-y-2 p-2 rounded-md border bg-background">
                      <p className="text-xs text-muted-foreground">
                        Mỗi dòng 1 câu:{" "}
                        <code className="bg-muted px-1 rounded">
                          Câu tiếng Việt | English 1 | English 2
                        </code>
                      </p>
                      <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        rows={5}
                        placeholder={
                          "Tôi thường dậy sớm. | I usually get up early. | I often get up early.\nAnh ấy dậy lúc 6 giờ. | He gets up at 6 o'clock."
                        }
                        className={cn(inputCls, "w-full font-mono text-xs")}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleApplyPaste}>
                          Áp dụng
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPasteOpen(false)}
                        >
                          Đóng
                        </Button>
                      </div>
                    </div>
                  )}

                  {drafts.map((d, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[20px_1fr] sm:grid-cols-[20px_1fr_1fr] gap-2 items-center"
                    >
                      <span className="text-xs text-muted-foreground text-right">
                        {i + 1}.
                      </span>
                      <input
                        value={d.vi}
                        onChange={(e) => updateDraft(i, "vi", e.target.value)}
                        placeholder="Câu tiếng Việt"
                        className={inputCls}
                      />
                      <input
                        value={d.en}
                        onChange={(e) => updateDraft(i, "en", e.target.value)}
                        placeholder="English (đáp án 1 | đáp án 2)"
                        className={cn(inputCls, "col-start-2 sm:col-start-auto")}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveWord}>
                    {editingWordId ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    {editingWordId ? "Lưu" : "Thêm từ"}
                  </Button>
                  {editingWordId && (
                    <Button size="sm" variant="ghost" onClick={resetWordForm}>
                      Hủy
                    </Button>
                  )}
                </div>
              </div>

              {/* box nhập hàng loạt */}
              {bulkOpen && (
                <div className="mb-4 p-3 rounded-lg border space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Mỗi dòng 1 từ, định dạng:{" "}
                    <code className="bg-muted px-1 rounded">
                      english | meaning | ipa
                    </code>{" "}
                    (ipa tùy chọn). Câu luyện tập thêm sau bằng nút ✏️.
                  </p>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={6}
                    placeholder={"prevent | ngăn chặn | /prɪˈvent/\nachieve | đạt được"}
                    className={cn(inputCls, "w-full font-mono")}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleBulkImport}>
                      Nhập
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBulkOpen(false)}
                    >
                      Đóng
                    </Button>
                  </div>
                </div>
              )}

              {/* danh sách từ */}
              <div className="divide-y">
                {selectedDeck.words.map((w) => {
                  const n = w.sentences?.length ?? 0;
                  return (
                    <div
                      key={w.id}
                      className={cn(
                        "flex items-center justify-between py-2",
                        editingWordId === w.id && "bg-accent/50 -mx-2 px-2 rounded-md"
                      )}
                    >
                      <div className="min-w-0">
                        <span className="font-medium">{w.english}</span>
                        {w.ipa && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {w.ipa}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground ml-2">
                          — {w.meaning}
                        </span>
                        <span
                          className={cn(
                            "text-[11px] px-1.5 py-0.5 rounded-md ml-2 align-middle",
                            n >= SENTENCE_COUNT
                              ? "bg-success/15 text-success"
                              : n > 0
                              ? "bg-reward/25 text-reward-foreground dark:text-reward"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {n}/{SENTENCE_COUNT} câu
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(w)}
                          className="text-muted-foreground hover:text-foreground p-1.5"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Xóa từ "${w.english}"?`)) deleteWord(w);
                          }}
                          className="text-muted-foreground hover:text-destructive p-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {selectedDeck.words.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Chưa có từ nào
                  </p>
                )}
              </div>

              {/* xóa deck */}
              <div className="pt-4 mt-4 border-t">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (
                      confirm(
                        `Xóa deck "${selectedDeck.name}" và toàn bộ từ bên trong?`
                      )
                    ) {
                      deleteDeck(selectedDeck.id);
                      setSelectedDeckId(null);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa deck này
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}