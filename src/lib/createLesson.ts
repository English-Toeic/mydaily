// src/lib/createLesson.ts
import { supabase } from "@/lib/supabase";
import { extractTitle } from "./lessonTitle";
import type { Row } from "@/components/AudioTranscribeForm";

export type Segment = {
  start: number;
  end: number;
  text: string;
  translation?: string;
};

/** Nếu title đã tồn tại → thêm (2), (3)... */
async function uniqueTitle(base: string): Promise<string> {
  const { data } = await supabase
    .from("lessons")
    .select("title")
    .like("title", `${base}%`);

  const taken = new Set((data ?? []).map((r) => r.title));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base} (${i})`)) i++;
  return `${base} (${i})`;
}

export async function createLessonFromResult(opts: {
  sectionId: string;
  segments: Row[];
}) {
  const { sectionId, segments } = opts;

  const baseTitle = extractTitle(
    [segments[0]?.english, segments[1]?.english],
    'Questions'
  );
  const title = await uniqueTitle(baseTitle);

  //viet câu lệnh lấy ra số lượng lesson trong section để set sort_order
  const { data: lessonsInSection } = await supabase
    .from("lessons")
    .select("id")
    .eq("section_id", sectionId);

  const sort_order = lessonsInSection ? lessonsInSection.length + 1 : 0;

  const { data, error } = await supabase
    .from("lessons")
    .insert(
      { section_id: sectionId, title, parts: 1, level: "A1", sort_order },
    )
    .select()
    .single();

  if (error) throw new Error(`Tạo lesson lỗi: ${error.message}`);
  console.log("[Lesson] created:", data.id, title);
  return data;
}