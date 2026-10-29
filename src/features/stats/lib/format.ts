// lib/format.ts
/** Dạng ngắn: "<1p", "25p", "1g05", "2g" */
export function fmtShort(sec: number): string {
  const m = Math.round(sec / 60);
  if (sec > 0 && m === 0) return "<1p";
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}g${String(r).padStart(2, "0")}` : `${h}g`;
}