// src/components/AdminView.tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import type { Section } from "@/types";
import { AudioTranscribeForm } from "./AudioTranscribeForm";

type Props = {
  sections: Section[];
  onBack: () => void;
  onChanged: () => void;
};

export function AdminView({ sections, onBack, onChanged }: Props) {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
        <h1 className="text-xl font-bold">Quản lý nội dung</h1>
      </div>

      <div className="space-y-8">
        <SectionForm onChanged={onChanged} />
        <LessonForm sections={sections} onChanged={onChanged} />
        <SentenceForm sections={sections} onChanged={onChanged} />
        {/* ✅ Form mới: thêm nhiều sentence */}
        <BulkSentenceForm sections={sections} onChanged={onChanged} />
        <AudioTranscribeForm sections={sections} onChanged={onChanged} />
      </div>
    </div>
  );
}

/* ================= SECTION ================= */
function SectionForm({ onChanged }: { onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("sections").insert({
      title: title.trim(),
      level: level.trim() || null,
      sort_order: Number(sortOrder) || 0,
    });
    setLoading(false);
    if (error) return alert(error.message);
    setTitle("");
    setLevel("");
    setSortOrder("0");
    onChanged();
  }

  return (
    <form onSubmit={submit} className="border rounded-lg p-4 space-y-3">
      <h2 className="font-semibold flex items-center gap-1">
        <Plus className="w-4 h-4" /> Thêm Section
      </h2>
      <Field label="Tiêu đề" value={title} onChange={setTitle} placeholder="Tên section" />
      <Field label="Level" value={level} onChange={setLevel} placeholder="A1, A2..." />
      <Field label="Thứ tự" type="number" value={sortOrder} onChange={setSortOrder} />
      <SubmitBtn loading={loading} />
    </form>
  );
}

/* ================= LESSON ================= */
function LessonForm({
  sections,
  onChanged,
}: {
  sections: Section[];
  onChanged: () => void;
}) {
  const [sectionId, setSectionId] = useState("");
  const [title, setTitle] = useState("");
  const [parts, setParts] = useState("");
  const [level, setLevel] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !sectionId) return alert("Chọn section và nhập tên");
    setLoading(true);
    const { error } = await supabase.from("lessons").insert({
      section_id: Number(sectionId),
      title: title.trim(),
      parts: parts.trim() ? Number(parts) : null,
      level: level.trim() || null,
      sort_order: Number(sortOrder) || 0,
    });
    setLoading(false);
    if (error) return alert(error.message);
    setTitle("");
    setParts("");
    setLevel("");
    setSortOrder("0");
    onChanged();
  }

  return (
    <form onSubmit={submit} className="border rounded-lg p-4 space-y-3">
      <h2 className="font-semibold flex items-center gap-1">
        <Plus className="w-4 h-4" /> Thêm Lesson
      </h2>
      <SelectField label="Section" value={sectionId} onChange={setSectionId}>
        <option value="">-- Chọn Section --</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </SelectField>
      <Field label="Tiêu đề" value={title} onChange={setTitle} placeholder="Tên lesson" />
      <Field label="Số parts" type="number" value={parts} onChange={setParts} />
      <Field label="Level" value={level} onChange={setLevel} placeholder="A1, A2..." />
      <Field label="Thứ tự" type="number" value={sortOrder} onChange={setSortOrder} />
      <SubmitBtn loading={loading} />
    </form>
  );
}

/* ================= SENTENCE (đơn lẻ) ================= */
function SentenceForm({
  sections,
  onChanged,
}: {
  sections: Section[];
  onChanged: () => void;
}) {
  const [sectionId, setSectionId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [english, setEnglish] = useState("");
  const [vietnamese, setVietnamese] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [loading, setLoading] = useState(false);

  const lessons = useMemo(
    () => sections.find((s) => String(s.id) === sectionId)?.lessons ?? [],
    [sections, sectionId]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!english.trim() || !lessonId) return alert("Chọn lesson và nhập câu");
    setLoading(true);
    const { error } = await supabase.from("sentences").insert({
      lesson_id: Number(lessonId),
      english: english.trim(),
      vietnamese: vietnamese.trim(),
      sort_order: Number(sortOrder) || 0,
    });
    setLoading(false);
    if (error) return alert(error.message);
    setEnglish("");
    setVietnamese("");
    setSortOrder("0");
    onChanged();
  }

  return (
    <form onSubmit={submit} className="border rounded-lg p-4 space-y-3">
      <h2 className="font-semibold flex items-center gap-1">
        <Plus className="w-4 h-4" /> Thêm Sentence
      </h2>
      <SelectField
        label="Section"
        value={sectionId}
        onChange={(v) => {
          setSectionId(v);
          setLessonId("");
        }}
      >
        <option value="">-- Chọn Section --</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Lesson"
        value={lessonId}
        onChange={setLessonId}
        disabled={!sectionId}
      >
        <option value="">-- Chọn Lesson --</option>
        {lessons.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title}
          </option>
        ))}
      </SelectField>

      <TextArea label="English" value={english} onChange={setEnglish} placeholder="Câu tiếng Anh" />
      <TextArea label="Vietnamese" value={vietnamese} onChange={setVietnamese} placeholder="Nghĩa tiếng Việt" />
      <Field label="Thứ tự" type="number" value={sortOrder} onChange={setSortOrder} />
      <SubmitBtn loading={loading} />
    </form>
  );
}

/* ================= BULK SENTENCE (NHIỀU CÂU) ================= */
function BulkSentenceForm({
  sections,
  onChanged,
}: {
  sections: Section[];
  onChanged: () => void;
}) {
  const [sectionId, setSectionId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [startOrder, setStartOrder] = useState("1");
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const lessons = useMemo(
    () => sections.find((s) => String(s.id) === sectionId)?.lessons ?? [],
    [sections, sectionId]
  );

  // Đếm số câu hợp lệ để preview
  const parsed = useMemo(() => {
    if (!bulkText.trim()) return [];
    return bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Hỗ trợ 3 format:
        // 1) english | vietnamese
        // 2) english \t vietnamese  (tab)
        // 3) english               (không có nghĩa)
        const sepIndex = line.indexOf("|");
        if (sepIndex !== -1) {
          return {
            english: line.slice(0, sepIndex).trim(),
            vietnamese: line.slice(sepIndex + 1).trim(),
          };
        }
        const tabIndex = line.indexOf("\t");
        if (tabIndex !== -1) {
          return {
            english: line.slice(0, tabIndex).trim(),
            vietnamese: line.slice(tabIndex + 1).trim(),
          };
        }
        return { english: line, vietnamese: "" };
      })
      .filter((item) => item.english.length > 0);
  }, [bulkText]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg(null);

    if (!lessonId) return alert("Chọn lesson trước");
    if (parsed.length === 0) return alert("Chưa có câu nào hợp lệ");

    setLoading(true);

    const start = Number(startOrder) || 1;
    const rows = parsed.map((item, i) => ({
      lesson_id: Number(lessonId),
      english: item.english,
      vietnamese: item.vietnamese || null,
      sort_order: start + i,
    }));

    // Supabase cho insert tối đa ~1000 rows/lần
    // Chia batch nếu nhiều
    const BATCH_SIZE = 500;
    let inserted = 0;
    let errorMsg: string | null = null;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("sentences").insert(batch);
      if (error) {
        errorMsg = error.message;
        break;
      }
      inserted += batch.length;
    }

    setLoading(false);

    if (errorMsg) {
      setResultMsg(`❌ Lỗi sau khi thêm ${inserted} câu: ${errorMsg}`);
    } else {
      setResultMsg(`✅ Đã thêm ${inserted} câu thành công!`);
      setBulkText("");
      setStartOrder(String(start + inserted));
      onChanged();
    }
  }

  return (
    <form onSubmit={submit} className="border rounded-lg p-4 space-y-3 border-primary/30 bg-primary/5">
      <h2 className="font-semibold flex items-center gap-1 text-primary">
        <Upload className="w-4 h-4" /> Thêm nhiều Sentence cùng lúc
      </h2>

      <p className="text-xs text-muted-foreground">
        Mỗi dòng 1 câu. Định dạng:{" "}
        <code className="bg-muted px-1 rounded text-[11px]">
          English | Vietnamese
        </code>{" "}
        hoặc dùng Tab ngăn cách, hoặc chỉ nhập English.
      </p>

      <SelectField
        label="Section"
        value={sectionId}
        onChange={(v) => {
          setSectionId(v);
          setLessonId("");
        }}
      >
        <option value="">-- Chọn Section --</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Lesson"
        value={lessonId}
        onChange={setLessonId}
        disabled={!sectionId}
      >
        <option value="">-- Chọn Lesson --</option>
        {lessons.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title} ({l.sentences?.length ?? 0} câu)
          </option>
        ))}
      </SelectField>

      <Field
        label="Sort order bắt đầu từ"
        type="number"
        value={startOrder}
        onChange={setStartOrder}
      />

      <label className="block text-sm">
        <span className="text-muted-foreground">Danh sách câu (mỗi dòng 1 câu)</span>
        <textarea
          rows={10}
          className="mt-1 w-full border rounded-md px-3 py-2 font-mono text-sm"
          value={bulkText}
          placeholder={`I need to fix this bug | Tôi cần sửa lỗi này
Can you review my code? | Bạn có thể review code không?
The build failed again | Bản build lại lỗi nữa rồi`}
          onChange={(e) => {
            setBulkText(e.target.value);
            setResultMsg(null);
          }}
        />
      </label>

      {/* Preview */}
      {parsed.length > 0 && (
        <div className="rounded-md border bg-background p-3 space-y-1">
          <p className="text-sm font-medium">
            Preview: {parsed.length} câu
          </p>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {parsed.map((item, i) => (
              <div
                key={i}
                className="flex gap-2 text-xs border-b border-dashed pb-1 last:border-0"
              >
                <span className="text-muted-foreground w-6 shrink-0 text-right">
                  {(Number(startOrder) || 1) + i}.
                </span>
                <span className="font-medium flex-1">{item.english}</span>
                {item.vietnamese && (
                  <span className="text-muted-foreground flex-1">
                    {item.vietnamese}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result message */}
      {resultMsg && (
        <p
          className={`text-sm font-medium ${
            resultMsg.startsWith("✅")
              ? "text-green-600"
              : "text-destructive"
          }`}
        >
          {resultMsg}
        </p>
      )}

      <Button type="submit" disabled={loading || parsed.length === 0}>
        {loading
          ? `Đang thêm ${parsed.length} câu...`
          : `Thêm ${parsed.length} câu`}
      </Button>
    </form>
  );
}

/* ================= UI HELPERS ================= */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type={type}
        className="mt-1 w-full border rounded-md px-3 py-2"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false} 
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <textarea
        rows={2}
        className="mt-1 w-full border rounded-md px-3 py-2"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        className="mt-1 w-full border rounded-md px-3 py-2 disabled:opacity-50"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function SubmitBtn({ loading }: { loading: boolean }) {
  return (
    <Button type="submit" disabled={loading}>
      {loading ? "Đang lưu..." : "Lưu"}
    </Button>
  );
}