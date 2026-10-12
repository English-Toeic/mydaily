import type { Section } from "@/types"; // chỉnh lại path theo project của bạn

export type View =
  | { name: "sections" }
  | { name: "lessons"; sectionId: number }
  | { name: "lesson"; lessonId: number }
  | { name: "vocab" }
  | { name: "vocabStudy"; deckId: number }
  | { name: "vocabAdmin" }
  | { name: "stats" }
  | { name: "admin" };

export type ViewName = View["name"];

export const HOME_VIEW: View = { name: "sections" };

/** Các view "tập trung": ẩn header và bottom nav */
export const FOCUS_VIEWS: ReadonlySet<ViewName> = new Set(["lesson", "vocabStudy"]);

export function viewKey(view: View): string {
  switch (view.name) {
    case "lessons":
      return `lessons:${view.sectionId}`;
    case "lesson":
      return `lesson:${view.lessonId}`;
    case "vocabStudy":
      return `vocabStudy:${view.deckId}`;
    default:
      return view.name;
  }
}

export function isSameView(a: View, b: View) {
  return viewKey(a) === viewKey(b);
}

export function isView(value: unknown): value is View {
  return typeof value === "object" && value !== null && "name" in value;
}

/** Map lessonId -> sectionId để tra cứu O(1), tránh dùng non-null assertion */
export function buildLessonSectionMap(sections: Section[]) {
  const map = new Map<number, number>();
  for (const s of sections) for (const l of s.lessons) map.set(l.id, s.id);
  return map;
}

/** View cha, dùng cho nút "Quay lại" trong từng màn hình */
export function getParentView(view: View, lessonSectionMap: Map<number, number>): View {
  switch (view.name) {
    case "lesson": {
      const sectionId = lessonSectionMap.get(view.lessonId);
      return sectionId != null ? { name: "lessons", sectionId } : HOME_VIEW;
    }
    case "vocabStudy":
    case "vocabAdmin":
      return { name: "vocab" };
    default:
      return HOME_VIEW;
  }
}