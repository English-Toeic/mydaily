// lib/annotate.ts
import { isMajor, normalize, type DiffKind, type DiffOp } from "@/lib/sentences";

export type Mark = "ok" | "soft" | "hard";
export interface AnnotatedWord { text: string; mark: Mark }
export interface Correction { user: string; answer: string; kind: DiffKind }

export const KIND_LABEL: Partial<Record<DiffKind, string>> = {
  typo: "chính tả",
  form: "dạng từ",
  minor: "hư từ",
  wrong: "sai từ",
};

/**
 * Diff chạy trên token đã chuẩn hoá ("don't" → do, not), nên cần map ngược về từ gốc.
 * Mỗi từ gốc normalize ra bao nhiêu token thì "ăn" bấy nhiêu op (trừ op "extra").
 */
export function annotate(answer: string, diff: DiffOp[]): AnnotatedWord[] {
  const words = answer.split(/\s+/).filter(Boolean);
  const ops = diff.filter((o) => o.kind !== "extra");
  const counts = words.map((w) => normalize(w).length);
  const plain = () => words.map((text) => ({ text, mark: "ok" as Mark }));

  if (!diff.length || counts.reduce((a, b) => a + b, 0) !== ops.length) return plain();

  let k = 0;
  return words.map((text, i) => {
    const mine = ops.slice(k, (k += counts[i]));
    const mark: Mark = mine.some(isMajor) ? "hard" : mine.some((o) => o.kind !== "ok") ? "soft" : "ok";
    return { text, mark };
  });
}

/** Từ thừa và danh sách "sai → đúng" để hiện dưới đáp án */
export function diffDetails(diff: DiffOp[]): { extras: string[]; fixes: Correction[] } {
  const extras = diff.filter((o) => o.kind === "extra" && o.user).map((o) => o.user!);
  const fixes = diff
    .filter((o) => o.user && o.answer && KIND_LABEL[o.kind])
    .map((o) => ({ user: o.user!, answer: o.answer!, kind: o.kind }));
  return { extras, fixes };
}