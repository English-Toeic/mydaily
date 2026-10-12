export const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const WEEKDAY_LONG = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** "YYYY-MM-DD" theo giờ địa phương (KHÔNG dùng toISOString vì đó là UTC) */
export function dateKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Cộng ngày, kết quả luôn là 0h giờ địa phương */
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Thứ Hai đầu tuần */
export function startOfWeek(d: Date): Date {
  return addDays(d, -((d.getDay() + 6) % 7));
}

export const fmtDM = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;

export const formatDayLong = (d: Date) => `${WEEKDAY_LONG[d.getDay()]}, ${fmtDM(d)}`;