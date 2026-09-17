// scripts/seed.ts
import { createClient } from "@supabase/supabase-js";
import { sections } from "../src/data/lessons";
import { SUPABASE_URL, SUPABASE_SECRET_KEY } from "../src/lib/constants";


console.log("URL:", SUPABASE_URL);
console.log("SUPABASE_SECRET_KEY:", SUPABASE_SECRET_KEY );

const url = SUPABASE_URL;
const key = SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("❌ Thiếu env: SUPABASE_URL hoặc SUPABASE_SECRET_KEY");
  // @ts-expect-error 123
  process.exit(1);
}

const supabase = createClient(
  url,
  key,
   {
  auth: { persistSession: false, autoRefreshToken: false },
}
);

async function seed() {
  for (const [si, section] of sections.entries()) {
    const { data: sec, error: e1 } = await supabase
      .from("sections")
      .insert({ title: section.title, level: section.level, sort_order: si })
      .select()
      .single();

    if (e1) {
      console.error("❌ Lỗi insert section:", e1); // 👈 in full error
      throw e1;
    }

    for (const [li, lesson] of section.lessons.entries()) {
      const { data: les, error: e2 } = await supabase
        .from("lessons")
        .insert({
          section_id: sec.id,
          title: lesson.title,
          parts: lesson.parts,
          level: lesson.level,
          sort_order: li,
        })
        .select()
        .single();
      
      if (e2) {
        console.error("❌ Lỗi insert lesson:", e2);
        throw e2;
      }

      if (lesson.sentences.length > 0) {
        // @ts-expect-error 123
        const rows = lesson.sentences.map((s, idx) => ({
          lesson_id: les.id,
          english: s.english,
          vietnamese: s.vietnamese,
          sort_order: idx,
        }));
        const { error: e3 } = await supabase.from("sentences").insert(rows);
        if (e3) {
          console.error("❌ Lỗi insert sentences:", e3);
          throw e3;
        }
      }
    }
    console.log(`✅ Seeded section: ${section.title}`);
  }
  console.log("🎉 Done!");
}

seed().catch((err) => {
  console.error("💥 Seed thất bại:", JSON.stringify(err, null, 2));
  // @ts-expect-error 123
  process.exit(1);
});