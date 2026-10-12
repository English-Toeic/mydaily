import type { MouseEvent } from "react";

/**
 * Gắn vào nút để khi bấm, nút không lấy focus.
 * Ô nhập đang focus được giữ nguyên, nên bàn phím mobile không bị thu xuống.
 * Không ảnh hưởng người dùng bàn phím: Tab/Enter/Space vẫn hoạt động bình thường.
 */
export const keepInputFocus = {
  onMouseDown: (e: MouseEvent) => e.preventDefault(),
} as const;