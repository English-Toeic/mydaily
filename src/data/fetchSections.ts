// src/data/fetchSections.ts
import { supabase } from "@/lib/supabase";
import type { Section } from "@/types";

export async function fetchSections(): Promise<Section[]> {
  const { data, error } = await supabase
    .from("sections")
    .select(
      `
      id,
      title,
      level,
      sort_order,
      lessons (
        id,
        title,
        parts,
        level,
        sort_order,
        sentences (
          id,
          english,
          vietnamese,
          sort_order
        )
      )
    `
    )
    .order("sort_order", { ascending: true })
    .order("sort_order", { referencedTable: "lessons", ascending: true })
    .order("sort_order", {
      referencedTable: "lessons.sentences",
      ascending: true,
    });

  if (error) throw error;

  // Map về đúng type Section
  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    level: s.level,
    lessons: (s.lessons ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      parts: l.parts,
      level: l.level,
      sentences: (l.sentences ?? []).map((sen) => ({
        id: sen.id,
        english: sen.english,
        vietnamese: sen.vietnamese,
      })),
    })),
  }));
}