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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Deck, Word } from "@/types/vocab";

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
    ipa: string | null
  ) => Promise<any>;
  updateWord: (
    word: Word,
    fields: { english: string; meaning: string; ipa: string | null }
  ) => Promise<void>;
  deleteWord: (word: Word) => Promise<void>;
  addWordsBulk: (
    deck_id: number,
    rows: { english: string; meaning: string; ipa: string | null }[]
  ) => Promise<any>;
}

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

  // ---- bulk ----
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const resetWordForm = () => {
    setEng("");
    setMean("");
    setIpa("");
    setEditingWordId(null);
  };

  const handleSaveWord = async () => {
    if (!selectedDeckId || !eng.trim() || !mean.trim()) return;
    try {
      if (editingWordId) {
        const w = selectedDeck?.words.find((x) => x.id === editingWordId);
        if (w)
          await updateWord(w, {
            english: eng.trim(),
            meaning: mean.trim(),
            ipa: ipa.trim() || null,
          });
      } else {
        await addWord(selectedDeckId, eng.trim(), mean.trim(), ipa.trim() || null);
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
                      className="flex-1 px-2 py-1 rounded-md border text-sm"
                    />
                    <button
                      onClick={() => handleRename(d.id)}
                      className="text-green-600 p-1"
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
              className="w-full px-2 py-1.5 rounded-md border text-sm"
            />
            <select
              value={newDeckParent ?? ""}
              onChange={(e) =>
                setNewDeckParent(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-2 py-1.5 rounded-md border text-sm bg-background"
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

              {/* form thêm / sửa từ */}
              <div className="space-y-2 mb-4 p-3 rounded-lg bg-muted/40">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    value={eng}
                    onChange={(e) => setEng(e.target.value)}
                    placeholder="English"
                    className="px-2 py-1.5 rounded-md border text-sm"
                  />
                  <input
                    value={mean}
                    onChange={(e) => setMean(e.target.value)}
                    placeholder="Nghĩa tiếng Việt"
                    className="px-2 py-1.5 rounded-md border text-sm"
                  />
                  <input
                    value={ipa}
                    onChange={(e) => setIpa(e.target.value)}
                    placeholder="IPA (tùy chọn)"
                    className="px-2 py-1.5 rounded-md border text-sm"
                  />
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
                    (ipa tùy chọn)
                  </p>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={6}
                    placeholder={"prevent | ngăn chặn | /prɪˈvent/\nachieve | đạt được"}
                    className="w-full px-2 py-1.5 rounded-md border text-sm font-mono"
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
                {selectedDeck.words.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between py-2"
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
                        className="text-muted-foreground hover:text-red-500 p-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
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
                  className="text-red-500 hover:text-red-600"
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