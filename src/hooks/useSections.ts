import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Section } from "@/types";

export function useSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("sections")
      .select(
        `
        id, title, level, sort_order, created_at,
        lessons (
          id, section_id, title, parts, level, sort_order, created_at,
          sentences (
            id, lesson_id, english, vietnamese, sort_order, created_at
          )
        )
      `
      )
      .order("sort_order", { ascending: true })
      .order("sort_order", { foreignTable: "lessons", ascending: true })
      .order("sort_order", {
        foreignTable: "lessons.sentences",
        ascending: true,
      });

    if (error) setError(error.message);
    else setSections((data as Section[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  return { sections, loading, error, refetch: fetchSections };
}