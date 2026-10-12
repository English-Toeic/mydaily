import { useEffect, useRef } from "react";

type Options = {
  enabled: boolean;
  onEnter: () => void;
  /** Chỉ chạy khi Ctrl được nhấn rồi thả mà không kèm phím nào khác */
  onReplay: () => void;
};

export function useLessonHotkeys({ enabled, onEnter, onReplay }: Options) {
  // Giữ handler mới nhất trong ref để không phải gỡ và gắn lại listener mỗi lần render
  const handlers = useRef({ onEnter, onReplay });
  useEffect(() => {
    handlers.current = { onEnter, onReplay };
  });

  useEffect(() => {
    if (!enabled) return;
    let ctrlAlone = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        if (!e.repeat) ctrlAlone = true;
        return;
      }
      ctrlAlone = false; // Ctrl+C, Ctrl+V... không tính là "chạm Ctrl"

      if (e.key !== "Enter") return;
      // Đang gõ bằng bộ gõ IME (Unikey/Telex) thì không nộp bài
      if (e.isComposing || e.keyCode === 229) return;
      // Đang focus vào nút hoặc link thì để phần tử đó tự xử lý Enter
      if ((e.target as HTMLElement | null)?.closest("button, a, [role='button']")) return;

      e.preventDefault();
      handlers.current.onEnter();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" && ctrlAlone) {
        ctrlAlone = false;
        handlers.current.onReplay();
      }
    };

    const cancel = () => {
      ctrlAlone = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", cancel); // Ctrl+click
    window.addEventListener("blur", cancel); // Ctrl+Tab rời trang
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, [enabled]);
}