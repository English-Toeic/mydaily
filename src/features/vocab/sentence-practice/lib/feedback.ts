// lib/feedback.ts
import type { SentenceVerdict } from "@/lib/sentences";

export function resultTitle(p: {
  verdict: SentenceVerdict;
  hasInput: boolean;
  overridden: boolean;
  hinted: boolean;
}): string {
  if (p.verdict === "wrong") return p.hasInput ? "Chưa đúng" : "Không sao, ghi nhớ nhé";
  if (p.verdict === "almost") return "Gần đúng, xem các chỗ tô màu nhé";
  if (p.overridden) return "Đã tính là đúng";
  if (p.hinted) return "Đúng, nhưng đã dùng gợi ý";
  return "Chính xác! 🎉";
}