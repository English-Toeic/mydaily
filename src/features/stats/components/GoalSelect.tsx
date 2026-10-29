// components/GoalSelect.tsx
import { GOAL_PRESETS } from "../hooks/useDailyGoal";

export function GoalSelect({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  return (
    <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
      Mục tiêu mỗi ngày
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground outline-none focus:border-primary"
      >
        {GOAL_PRESETS.map((m) => (
          <option key={m} value={m}>
            {m} phút
          </option>
        ))}
      </select>
    </label>
  );
}