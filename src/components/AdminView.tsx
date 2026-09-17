import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus } from "lucide-react";
import type { Section } from "@/types";

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

/* ================= SENTENCE ================= */
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