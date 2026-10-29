// lib/retry.ts
import type { SentenceCheck } from "@/lib/sentences";

export interface RetryInfo {
  summary: string;
  /** Các từ người dùng viết cần xem lại */
  flagged: string[];
  targetMissing: boolean;
}

/** Mô tả lỗi khi sai lần 1, không lộ đáp án */
export function describeErrors(r: SentenceCheck, target: string): RetryInfo {
  const targetMissing = r.targetMissing && !!target;
  // Khác quá nhiều thì đếm lỗi không còn ý nghĩa
  if (r.similarity < 0.3) {
    return { summary: "Câu còn khác khá nhiều, thử dịch lại từng ý nhé!", flagged: [], targetMissing };
  }

  let wrong = 0, missing = 0, extra = 0, swap = 0, small = 0;
  const flagged: string[] = [];
  for (const o of r.diff) {
    switch (o.kind) {
      case "ok": continue;
      case "missing": missing++; continue;
      case "extra": extra++; break;
      case "wrong": wrong++; break;
      case "swap": swap++; break;
      default: small++; // typo, form, minor
    }
    if (o.user && !flagged.includes(o.user)) flagged.push(o.user);
  }

  const parts = [
    wrong && `sai ${wrong} từ`,
    missing && `thiếu ${missing} từ`,
    extra && `thừa ${extra} từ`,
    swap && "sai thứ tự từ",
    small && `${small} lỗi nhỏ (chính tả, dạng từ)`,
  ].filter(Boolean) as string[];

  const text = parts.length ? parts.join(", ") : "chưa dùng đúng từ đang học";
  return { summary: `${text[0].toUpperCase()}${text.slice(1)}. Sửa lại thử nhé!`, flagged, targetMissing };
}