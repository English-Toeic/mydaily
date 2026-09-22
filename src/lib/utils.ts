// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CONTRACTION_MAP } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Chuẩn hoá: lowercase, bỏ dấu câu, trim khoảng trắng thừa.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sinh tất cả biến thể contraction/expansion của 1 câu đã normalize.
 * Dùng BFS để xử lý nhiều chỗ viết tắt trong cùng 1 câu.
 *
 * Ví dụ: "i'm going and she's here"
 *   → "i am going and she's here"
 *   → "i'm going and she is here"
 *   → "i am going and she is here"
 *   ... (+ has variants)
 */
export function generateVariants(sentence: string): Set<string> {
  const base = normalize(sentence);
  const variants = new Set<string>();
  variants.add(base);

  // Sắp xếp key dài → ngắn để match pattern dài nhất trước
  const keys = Object.keys(CONTRACTION_MAP).sort(
    (a, b) => b.length - a.length
  );

  // BFS với queue
  const queue = [base];
  const visited = new Set<string>();
  visited.add(base);

  // Giới hạn để tránh bùng nổ tổ hợp
  const MAX_VARIANTS = 64;

  while (queue.length > 0 && variants.size < MAX_VARIANTS) {
    const current = queue.shift()!;

    for (const key of keys) {
      // Tìm tất cả vị trí xuất hiện của key trong current (word-boundary)
      const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, "g");
      let match: RegExpExecArray | null;

      while (
        (match = regex.exec(current)) !== null &&
        variants.size < MAX_VARIANTS
      ) {
        const start = match.index;
        const end = start + key.length;
        const replacements = CONTRACTION_MAP[key];

        for (const rep of replacements) {
          const newSentence =
            current.slice(0, start) + rep + current.slice(end);
          const cleaned = normalize(newSentence);

          if (!visited.has(cleaned)) {
            visited.add(cleaned);
            variants.add(cleaned);
            queue.push(cleaned);
          }
        }
      }
    }
  }

  return variants;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * So sánh 2 câu: chấp nhận cả viết tắt lẫn đầy đủ.
 * Trả true nếu userInput khớp correctAnswer hoặc 1 trong các biến thể.
 */
export function isAnswerCorrect(userInput: string, correctAnswer: string): boolean {
  const normalizedUser = normalize(userInput);
  const normalizedCorrect = normalize(correctAnswer);

  // Trường hợp đơn giản: khớp trực tiếp
  if (normalizedUser === normalizedCorrect) return true;

  // Sinh tất cả biến thể của đáp án đúng → kiểm tra user có khớp variant nào
  const correctVariants = generateVariants(correctAnswer);
  if (correctVariants.has(normalizedUser)) return true;

  // Sinh biến thể của user → kiểm tra có khớp đáp án gốc
  const userVariants = generateVariants(userInput);
  if (userVariants.has(normalizedCorrect)) return true;

  return false;
}