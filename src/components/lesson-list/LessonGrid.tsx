import { LessonCard } from "./LessonCard";
import { STAGGER_MAX, STAGGER_STEP_MS } from "./config";
import type { LessonItem } from "./types";

type Props = {
  items: LessonItem[];
  nextId: number | undefined;
  onOpen: (lessonId: number) => void;
};

export function LessonGrid({ items, nextId, onOpen }: Props) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <li
          key={item.lesson.id}
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 motion-reduce:animate-none"
          style={{ animationDelay: `${Math.min(i, STAGGER_MAX) * STAGGER_STEP_MS}ms` }}
        >
          <LessonCard item={item} isNext={item.lesson.id === nextId} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}